<?php
/**
 * Safaricom Daraja client for Lipa na M-Pesa Online (STK Push). Server side only.
 */
defined( 'ABSPATH' ) || exit;

class Ciel_Mpesa_Daraja {

	const SANDBOX    = 'https://sandbox.safaricom.co.ke';
	const PRODUCTION = 'https://api.safaricom.co.ke';

	private $env;
	private $base;
	private $key;
	private $secret;
	private $shortcode;
	private $passkey;
	private $till;

	/**
	 * @param array $cfg environment, consumer_key, consumer_secret, shortcode, passkey, till
	 */
	public function __construct( array $cfg ) {
		$this->env       = ( isset( $cfg['environment'] ) && 'production' === $cfg['environment'] ) ? 'production' : 'sandbox';
		$this->base      = 'production' === $this->env ? self::PRODUCTION : self::SANDBOX;
		// For automated tests against a mock Daraja only. Do not define this on a live site.
		if ( defined( 'CIEL_MPESA_DARAJA_BASE_URL' ) && CIEL_MPESA_DARAJA_BASE_URL ) {
			$this->base = untrailingslashit( CIEL_MPESA_DARAJA_BASE_URL );
		}
		$this->key       = trim( (string) ( $cfg['consumer_key'] ?? '' ) );
		$this->secret    = trim( (string) ( $cfg['consumer_secret'] ?? '' ) );
		$this->shortcode = trim( (string) ( $cfg['shortcode'] ?? '' ) );
		$this->passkey   = trim( (string) ( $cfg['passkey'] ?? '' ) );
		$this->till      = trim( (string) ( $cfg['till'] ?? '' ) );
	}

	public function is_configured() {
		return '' !== $this->key && '' !== $this->secret && '' !== $this->shortcode && '' !== $this->passkey;
	}

	public function environment() {
		return $this->env;
	}

	/** Kenyan mobile number to 2547XXXXXXXX / 2541XXXXXXXX, or null. */
	public static function normalize_phone( $input ) {
		$p = preg_replace( '/[\s\-().]/', '', trim( (string) $input ) );
		if ( 0 === strpos( $p, '+' ) ) {
			$p = substr( $p, 1 );
		}
		if ( ! preg_match( '/^\d+$/', $p ) ) {
			return null;
		}
		if ( '0' === $p[0] && 10 === strlen( $p ) ) {
			$p = '254' . substr( $p, 1 );
		} elseif ( ( '7' === $p[0] || '1' === $p[0] ) && 9 === strlen( $p ) ) {
			$p = '254' . $p;
		}
		return preg_match( '/^254(7|1)\d{8}$/', $p ) ? $p : null;
	}

	/** 254712345678 -> 0712 *** 678 */
	public static function mask_phone( $p ) {
		$n = self::normalize_phone( $p );
		return $n ? '0' . substr( $n, 3, 3 ) . ' *** ' . substr( $n, -3 ) : '';
	}

	/** YYYYMMDDHHmmss in East Africa Time (UTC+3). */
	public static function timestamp( $time = null ) {
		return gmdate( 'YmdHis', ( null === $time ? time() : $time ) + 3 * HOUR_IN_SECONDS );
	}

	private function password( $ts ) {
		return base64_encode( $this->shortcode . $this->passkey . $ts ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}

	/** Maps a Daraja ResultCode to paid / cancelled / expired / failed. Unknown codes are failures. */
	public static function state_for_result( $code ) {
		$c = (string) $code;
		if ( '0' === $c ) {
			return 'paid';
		}
		if ( '1032' === $c ) {
			return 'cancelled';
		}
		if ( '1037' === $c || '1019' === $c ) {
			return 'expired';
		}
		return 'failed';
	}

	private function request( $method, $path, $args ) {
		$args = array_merge( array( 'method' => $method, 'timeout' => 20 ), $args );
		$res  = wp_remote_request( $this->base . $path, $args );
		if ( is_wp_error( $res ) ) {
			return new WP_Error( 'ciel_mpesa_network', __( 'Could not reach M-Pesa. Please try again.', 'ciel-mpesa' ), $res->get_error_message() );
		}
		$body = wp_remote_retrieve_body( $res );
		$json = json_decode( $body, true );
		return array( 'status' => (int) wp_remote_retrieve_response_code( $res ), 'json' => is_array( $json ) ? $json : array(), 'raw' => substr( (string) $body, 0, 300 ) );
	}

	private function token_key() {
		return 'ciel_mpesa_tok_' . md5( $this->env . '|' . $this->base . '|' . $this->key );
	}

	/** OAuth token, cached in a transient until shortly before it expires. */
	public function token( $force = false ) {
		$cache = $this->token_key();
		if ( ! $force ) {
			$t = get_transient( $cache );
			if ( $t ) {
				return $t;
			}
		}
		$r = $this->request( 'GET', '/oauth/v1/generate?grant_type=client_credentials', array(
			'headers' => array( 'Authorization' => 'Basic ' . base64_encode( $this->key . ':' . $this->secret ) ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		) );
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		if ( empty( $r['json']['access_token'] ) ) {
			return new WP_Error( 'ciel_mpesa_auth', __( 'Could not authenticate with M-Pesa.', 'ciel-mpesa' ), $r['raw'] );
		}
		$ttl = max( 60, (int) ( $r['json']['expires_in'] ?? 3599 ) ) - 60;
		set_transient( $cache, $r['json']['access_token'], max( 60, $ttl ) );
		return $r['json']['access_token'];
	}

	private function post( $path, array $body, $retried = false ) {
		$token = $this->token();
		if ( is_wp_error( $token ) ) {
			return $token;
		}
		$r = $this->request( 'POST', $path, array(
			'headers' => array( 'Authorization' => 'Bearer ' . $token, 'Content-Type' => 'application/json' ),
			'body'    => wp_json_encode( $body ),
		) );
		if ( ! is_wp_error( $r ) && 401 === $r['status'] && ! $retried ) {
			delete_transient( $this->token_key() );
			return $this->post( $path, $body, true );
		}
		return $r;
	}

	/**
	 * Sends the STK Push. Success here means Daraja ACCEPTED the request, not that anyone paid.
	 *
	 * @return array|WP_Error checkout_request_id, merchant_request_id
	 */
	public function stk_push( $phone, $amount, $reference, $description, $callback_url ) {
		$ts      = self::timestamp();
		$is_till = '' !== $this->till;
		$r       = $this->post( '/mpesa/stkpush/v1/processrequest', array(
			'BusinessShortCode' => $this->shortcode,
			'Password'          => $this->password( $ts ),
			'Timestamp'         => $ts,
			'TransactionType'   => $is_till ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
			'Amount'            => (int) $amount,
			'PartyA'            => $phone,
			'PartyB'            => $is_till ? $this->till : $this->shortcode,
			'PhoneNumber'       => $phone,
			'CallBackURL'       => $callback_url,
			'AccountReference'  => substr( (string) $reference, 0, 12 ),
			'TransactionDesc'   => substr( (string) $description, 0, 13 ),
		) );
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		$j = $r['json'];
		if ( isset( $j['ResponseCode'] ) && '0' === (string) $j['ResponseCode'] && ! empty( $j['CheckoutRequestID'] ) ) {
			return array( 'checkout_request_id' => (string) $j['CheckoutRequestID'], 'merchant_request_id' => (string) ( $j['MerchantRequestID'] ?? '' ) );
		}
		$detail = (string) ( $j['errorMessage'] ?? $j['ResponseDescription'] ?? $r['raw'] );
		return new WP_Error( 'ciel_mpesa_rejected', __( 'M-Pesa could not send the payment request. Check the number and try again.', 'ciel-mpesa' ), $detail );
	}

	/**
	 * Asks Daraja for the result of an STK Push.
	 *
	 * @return array|WP_Error state (paid|cancelled|expired|failed|pending), result_code, result_desc
	 */
	public function stk_query( $checkout_request_id ) {
		$ts = self::timestamp();
		$r  = $this->post( '/mpesa/stkpushquery/v1/query', array(
			'BusinessShortCode' => $this->shortcode,
			'Password'          => $this->password( $ts ),
			'Timestamp'         => $ts,
			'CheckoutRequestID' => $checkout_request_id,
		) );
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		$j    = $r['json'];
		$desc = (string) ( $j['ResultDesc'] ?? $j['errorMessage'] ?? '' );
		if ( ! isset( $j['ResultCode'] ) ) {
			// "The transaction is being processed" (errorCode 500.001.1001) while the customer decides.
			return array( 'state' => 'pending', 'result_code' => null, 'result_desc' => $desc );
		}
		return array( 'state' => self::state_for_result( $j['ResultCode'] ), 'result_code' => (string) $j['ResultCode'], 'result_desc' => $desc );
	}

	/**
	 * Parses Daraja's callback JSON. Returns null when it is not a well-formed STK callback.
	 */
	public static function parse_callback( $body ) {
		$cb = $body['Body']['stkCallback'] ?? null;
		if ( ! is_array( $cb ) ) {
			return null;
		}
		$id = isset( $cb['CheckoutRequestID'] ) && is_string( $cb['CheckoutRequestID'] ) ? trim( $cb['CheckoutRequestID'] ) : '';
		if ( '' === $id || strlen( $id ) > 100 || ! isset( $cb['ResultCode'] ) || ! preg_match( '/^\d+$/', (string) $cb['ResultCode'] ) ) {
			return null;
		}
		$meta  = array();
		$items = $cb['CallbackMetadata']['Item'] ?? array();
		if ( is_array( $items ) ) {
			foreach ( $items as $it ) {
				if ( is_array( $it ) && isset( $it['Name'] ) && array_key_exists( 'Value', $it ) ) {
					$meta[ $it['Name'] ] = $it['Value'];
				}
			}
		}
		return array(
			'checkout_request_id' => $id,
			'result_code'         => (string) $cb['ResultCode'],
			'result_desc'         => substr( (string) ( $cb['ResultDesc'] ?? '' ), 0, 300 ),
			'amount'              => isset( $meta['Amount'] ) && is_numeric( $meta['Amount'] ) ? (float) $meta['Amount'] : null,
			'receipt'             => isset( $meta['MpesaReceiptNumber'] ) ? substr( sanitize_text_field( (string) $meta['MpesaReceiptNumber'] ), 0, 40 ) : null,
			'transaction_date'    => isset( $meta['TransactionDate'] ) ? (string) $meta['TransactionDate'] : null,
			'phone'               => isset( $meta['PhoneNumber'] ) ? (string) $meta['PhoneNumber'] : null,
		);
	}
}
