<?php
/**
 * REST endpoints:
 *   POST /wp-json/ciel-mpesa/v1/callback/{secret}   Safaricom's STK result
 *   GET  /wp-json/ciel-mpesa/v1/status?order_id=&key=  the buyer's thank-you page polls this
 * plus an admin order action that checks a payment with Daraja.
 */
defined( 'ABSPATH' ) || exit;

class Ciel_Mpesa_Rest {

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
		add_filter( 'woocommerce_order_actions', array( __CLASS__, 'order_actions' ), 10, 2 );
		add_action( 'woocommerce_order_action_ciel_mpesa_check', array( __CLASS__, 'admin_check' ) );
	}

	public static function routes() {
		register_rest_route( 'ciel-mpesa/v1', '/callback/(?P<secret>[A-Za-z0-9_-]{24,100})', array(
			'methods'             => 'POST',
			'callback'            => array( __CLASS__, 'callback' ),
			'permission_callback' => '__return_true', // Safaricom cannot authenticate; the secret in the path and a Daraja query protect this.
		) );
		register_rest_route( 'ciel-mpesa/v1', '/status', array(
			'methods'             => 'GET',
			'callback'            => array( __CLASS__, 'status' ),
			'permission_callback' => '__return_true', // Checked with the order key below.
			'args'                => array(
				'order_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
				'key'      => array( 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
			),
		) );
	}

	private static function ack( $code = 200, $result = 0, $desc = 'Accepted' ) {
		return new WP_REST_Response( array( 'ResultCode' => $result, 'ResultDesc' => $desc ), $code );
	}

	public static function callback( WP_REST_Request $request ) {
		if ( ! hash_equals( Ciel_Mpesa_Gateway::callback_secret(), (string) $request['secret'] ) ) {
			Ciel_Mpesa_Gateway::log( 'Callback with a wrong secret was rejected.' );
			return self::ack( 403, 1, 'Rejected' );
		}
		$raw = $request->get_body();
		if ( strlen( $raw ) > 16384 ) {
			return self::ack( 413, 1, 'Too large' );
		}
		$cb = Ciel_Mpesa_Daraja::parse_callback( json_decode( $raw, true ) );
		if ( ! $cb ) {
			return self::ack( 400, 1, 'Malformed callback' );
		}
		$order = Ciel_Mpesa_Gateway::find_order_by_request( $cb['checkout_request_id'] );
		if ( ! $order ) {
			Ciel_Mpesa_Gateway::log( 'Callback for an unknown request ' . $cb['checkout_request_id'] );
			return self::ack();
		}
		$requests = Ciel_Mpesa_Gateway::requests( $order );
		$req      = $requests[ $cb['checkout_request_id'] ] ?? null;
		if ( ! $req ) {
			return self::ack();
		}
		$state = Ciel_Mpesa_Daraja::state_for_result( $cb['result_code'] );
		if ( 'paid' === $req['state'] ) {
			// Already confirmed (for example by a status query). Only a missing receipt can be added.
			if ( 'paid' === $state ) {
				Ciel_Mpesa_Gateway::settle( $order->get_id(), $cb['checkout_request_id'], 'paid', $cb, 'callback' );
			}
			return self::ack();
		}
		Ciel_Mpesa_Gateway::log( 'Callback for order ' . $order->get_id() . ': ' . $state . ' (' . $cb['result_code'] . ')' );

		if ( 'paid' !== $state ) {
			Ciel_Mpesa_Gateway::settle( $order->get_id(), $cb['checkout_request_id'], $state, $cb, 'callback' );
			return self::ack();
		}
		if ( null === $cb['amount'] || (int) round( $cb['amount'] ) !== (int) $req['amount'] ) {
			$cb['result_desc'] = sprintf( 'Amount mismatch: callback %s, expected %s', $cb['amount'], $req['amount'] );
			Ciel_Mpesa_Gateway::settle( $order->get_id(), $cb['checkout_request_id'], 'review', $cb, 'callback' );
			return self::ack();
		}
		$gw = Ciel_Mpesa_Gateway::instance();
		if ( 'yes' !== $gw->get_option( 'verify_query', 'yes' ) ) {
			Ciel_Mpesa_Gateway::settle( $order->get_id(), $cb['checkout_request_id'], 'paid', $cb, 'callback' );
			return self::ack();
		}
		// Keep the callback's receipt so a later query can complete the order with it.
		$requests[ $cb['checkout_request_id'] ]['receipt'] = $cb['receipt'];
		$requests[ $cb['checkout_request_id'] ]['cb']      = '0';
		$order->update_meta_data( '_ciel_mpesa_requests', $requests );
		$order->save();
		$q = $gw->daraja()->stk_query( $cb['checkout_request_id'] );
		if ( is_wp_error( $q ) || 'pending' === $q['state'] ) {
			return self::ack(); // the status check finishes verification
		}
		if ( 'paid' === $q['state'] ) {
			Ciel_Mpesa_Gateway::settle( $order->get_id(), $cb['checkout_request_id'], 'paid', $cb, 'callback + query' );
		} else {
			$cb['result_desc'] = 'Callback said paid but the query said ' . $q['state'] . ' (' . $q['result_code'] . ')';
			Ciel_Mpesa_Gateway::settle( $order->get_id(), $cb['checkout_request_id'], 'review', $cb, 'callback + query' );
		}
		return self::ack();
	}

	public static function status( WP_REST_Request $request ) {
		$order = wc_get_order( $request['order_id'] );
		if ( ! $order || ! hash_equals( $order->get_order_key(), (string) $request['key'] ) ) {
			return new WP_REST_Response( array( 'error' => 'not_found' ), 404 );
		}
		$last = Ciel_Mpesa_Gateway::last_request( $order );
		if ( $last && in_array( $last['state'], array( 'pending', 'timeout' ), true ) && ! $order->is_paid() ) {
			$age   = time() - (int) $last['at'];
			$throttle = 'ciel_mpesa_q_' . md5( $last['id'] );
			if ( $age >= 8 && ! get_transient( $throttle ) && 'pending' === $last['state'] ) {
				set_transient( $throttle, 1, 5 );
				$r = Ciel_Mpesa_Gateway::check_with_daraja( $order, $last['id'], 'status query' );
				// A success seen by the query is completed with the callback's receipt if we already have it.
				if ( 'pending' === $r && $age > Ciel_Mpesa_Gateway::EXPIRE_AFTER ) {
					Ciel_Mpesa_Gateway::settle( $order->get_id(), $last['id'], 'timeout', array( 'result_desc' => '' ), 'timeout' );
				}
			}
			$order = wc_get_order( $order->get_id() );
			$last  = Ciel_Mpesa_Gateway::last_request( $order );
		}
		$state = $order->is_paid() ? 'paid' : ( $last ? $last['state'] : 'none' );
		return new WP_REST_Response( array(
			'state'   => $state,
			'receipt' => $order->is_paid() ? (string) $order->get_meta( '_ciel_mpesa_receipt' ) : '',
			'order'   => $order->get_order_number(),
			'status'  => $order->get_status(),
		), 200 );
	}

	public static function order_actions( $actions, $order = null ) {
		if ( $order instanceof WC_Order && 'ciel_mpesa' === $order->get_payment_method() && Ciel_Mpesa_Gateway::last_request( $order ) ) {
			$actions['ciel_mpesa_check'] = __( 'Check M-Pesa payment status', 'ciel-mpesa' );
		}
		return $actions;
	}

	public static function admin_check( $order ) {
		$last = Ciel_Mpesa_Gateway::last_request( $order );
		if ( ! $last ) {
			return;
		}
		if ( ! in_array( $last['state'], array( 'pending', 'timeout' ), true ) ) {
			$order->add_order_note( sprintf( __( 'M-Pesa status check: already %s.', 'ciel-mpesa' ), $last['state'] ) );
			return;
		}
		$r = Ciel_Mpesa_Gateway::check_with_daraja( $order, $last['id'], 'admin check' );
		if ( 'pending' === $r ) {
			$order->add_order_note( __( 'M-Pesa status check: still waiting for the customer.', 'ciel-mpesa' ) );
		}
	}
}
