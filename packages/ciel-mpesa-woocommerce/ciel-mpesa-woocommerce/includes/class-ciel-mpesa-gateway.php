<?php
/**
 * WooCommerce payment gateway: M-Pesa STK Push.
 */
defined( 'ABSPATH' ) || exit;

class Ciel_Mpesa_Gateway extends WC_Payment_Gateway {

	const SECRET_OPTION = 'ciel_mpesa_callback_secret';
	const PENDING_WAIT  = 90;   // seconds before the same order may send another prompt
	const EXPIRE_AFTER  = 300;  // seconds without a result before the request is treated as timed out

	public function __construct() {
		$this->id                 = 'ciel_mpesa';
		$this->method_title       = __( 'Ciel M-Pesa (STK Push)', 'ciel-mpesa' );
		$this->method_description = __( 'Customers enter their Safaricom number and approve the payment on their phone with their M-Pesa PIN. Orders are marked paid only after Safaricom confirms.', 'ciel-mpesa' );
		$this->has_fields         = true;
		$this->supports           = array( 'products' );
		$this->init_form_fields();
		$this->init_settings();
		$this->title             = $this->get_option( 'title' );
		$this->description       = $this->get_option( 'description' );
		$this->order_button_text = $this->get_option( 'button_text', __( 'Pay with M-Pesa', 'ciel-mpesa' ) );
		$this->icon              = '';

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_before_thankyou', array( $this, 'thankyou_panel' ), 5 ); // top of the page on classic themes
		add_action( 'woocommerce_thankyou_' . $this->id, array( $this, 'thankyou_panel' ) ); // block themes
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		if ( ! has_filter( 'woocommerce_order_button_text', array( __CLASS__, 'button_text_filter' ) ) ) {
			add_filter( 'woocommerce_order_button_text', array( __CLASS__, 'button_text_filter' ) );
		}
	}

	/**
	 * WooCommerce only swaps the button label when shoppers switch methods. When M-Pesa is
	 * the selected (or the only) method on first load, set the label here.
	 */
	public static function button_text_filter( $text ) {
		if ( ! function_exists( 'WC' ) || ! WC()->session || ! WC()->payment_gateways() ) {
			return $text;
		}
		$available = WC()->payment_gateways()->get_available_payment_gateways();
		if ( ! isset( $available['ciel_mpesa'] ) ) {
			return $text;
		}
		$chosen = WC()->session->get( 'chosen_payment_method' );
		if ( 'ciel_mpesa' === $chosen || ( ! $chosen && 'ciel_mpesa' === array_key_first( $available ) ) || 1 === count( $available ) ) {
			return $available['ciel_mpesa']->order_button_text ? $available['ciel_mpesa']->order_button_text : $text;
		}
		return $text;
	}

	/* ------------------------------------------------------------------ settings */

	public static function callback_secret() {
		$s = get_option( self::SECRET_OPTION );
		if ( ! $s || strlen( $s ) < 24 ) {
			$s = rtrim( strtr( base64_encode( random_bytes( 24 ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			update_option( self::SECRET_OPTION, $s, false );
		}
		return $s;
	}

	public static function callback_url() {
		return rest_url( 'ciel-mpesa/v1/callback/' . self::callback_secret() );
	}

	public function init_form_fields() {
		$this->form_fields = array(
			'enabled'          => array( 'title' => __( 'Enable', 'ciel-mpesa' ), 'type' => 'checkbox', 'label' => __( 'Accept M-Pesa (STK Push) at checkout', 'ciel-mpesa' ), 'default' => 'no' ),
			'title'            => array( 'title' => __( 'Title', 'ciel-mpesa' ), 'type' => 'text', 'default' => __( 'M-Pesa', 'ciel-mpesa' ), 'desc_tip' => true, 'description' => __( 'What customers see at checkout.', 'ciel-mpesa' ) ),
			'description'      => array( 'title' => __( 'Description', 'ciel-mpesa' ), 'type' => 'textarea', 'default' => __( 'Enter your Safaricom number. You will get a prompt on your phone to approve the payment with your M-Pesa PIN.', 'ciel-mpesa' ) ),
			'button_text'      => array( 'title' => __( 'Order button text', 'ciel-mpesa' ), 'type' => 'text', 'default' => __( 'Pay with M-Pesa', 'ciel-mpesa' ), 'description' => __( 'Classic checkout only. The block checkout uses its own button label.', 'ciel-mpesa' ) ),
			'accent'           => array( 'title' => __( 'Accent colour', 'ciel-mpesa' ), 'type' => 'color', 'default' => '#1F9D55', 'description' => __( 'Used for the M-Pesa phone field focus and the payment status panel. Everything else follows your theme.', 'ciel-mpesa' ) ),
			'daraja'           => array( 'title' => __( 'Daraja API', 'ciel-mpesa' ), 'type' => 'title', 'description' => __( 'From your app on the Safaricom developer portal. Start with sandbox credentials; switch to production after Safaricom approves your app.', 'ciel-mpesa' ) ),
			'environment'      => array( 'title' => __( 'Environment', 'ciel-mpesa' ), 'type' => 'select', 'options' => array( 'sandbox' => __( 'Sandbox (testing, no real money)', 'ciel-mpesa' ), 'production' => __( 'Production (live payments)', 'ciel-mpesa' ) ), 'default' => 'sandbox' ),
			'consumer_key'     => array( 'title' => __( 'Consumer key', 'ciel-mpesa' ), 'type' => 'ciel_secret' ),
			'consumer_secret'  => array( 'title' => __( 'Consumer secret', 'ciel-mpesa' ), 'type' => 'ciel_secret' ),
			'type'             => array( 'title' => __( 'Account type', 'ciel-mpesa' ), 'type' => 'select', 'options' => array( 'paybill' => __( 'Paybill', 'ciel-mpesa' ), 'till' => __( 'Till number (Buy Goods)', 'ciel-mpesa' ) ), 'default' => 'paybill' ),
			'shortcode'        => array( 'title' => __( 'Business shortcode', 'ciel-mpesa' ), 'type' => 'text', 'description' => __( 'Your Paybill number. For a till, the store / head-office number Safaricom gave you for STK Push (sandbox: 174379).', 'ciel-mpesa' ), 'custom_attributes' => array( 'inputmode' => 'numeric', 'autocomplete' => 'off' ) ),
			'till'             => array( 'title' => __( 'Till number', 'ciel-mpesa' ), 'type' => 'text', 'description' => __( 'Only for Till (Buy Goods): the number customers pay to.', 'ciel-mpesa' ), 'custom_attributes' => array( 'inputmode' => 'numeric', 'autocomplete' => 'off' ) ),
			'passkey'          => array( 'title' => __( 'Passkey', 'ciel-mpesa' ), 'type' => 'ciel_secret', 'description' => __( 'The Lipa na M-Pesa Online passkey for the shortcode above.', 'ciel-mpesa' ) ),
			'reference_prefix' => array( 'title' => __( 'Account reference prefix', 'ciel-mpesa' ), 'type' => 'text', 'default' => '', 'description' => __( 'Optional letters before the order number on the customer\'s M-Pesa message, e.g. "SHOP". Total length is limited to 12 characters.', 'ciel-mpesa' ) ),
			'callback'         => array( 'title' => __( 'Callback', 'ciel-mpesa' ), 'type' => 'ciel_callback' ),
			'verify_query'     => array( 'title' => __( 'Verify results', 'ciel-mpesa' ), 'type' => 'checkbox', 'label' => __( 'Confirm every successful callback with an STK query before marking the order paid (recommended)', 'ciel-mpesa' ), 'default' => 'yes' ),
			'debug'            => array( 'title' => __( 'Debug log', 'ciel-mpesa' ), 'type' => 'checkbox', 'label' => __( 'Log M-Pesa events to WooCommerce → Status → Logs (no keys or full phone numbers are logged)', 'ciel-mpesa' ), 'default' => 'no' ),
		);
	}

	/** Secret fields are never sent back to the browser. Leave blank to keep the saved value. */
	public function generate_ciel_secret_html( $key, $data ) {
		$field = $this->get_field_key( $key );
		$saved = '' !== (string) $this->get_option( $key );
		ob_start();
		?>
		<tr valign="top">
			<th scope="row" class="titledesc"><label for="<?php echo esc_attr( $field ); ?>"><?php echo esc_html( $data['title'] ); ?></label></th>
			<td class="forminp">
				<input class="input-text regular-input" type="password" name="<?php echo esc_attr( $field ); ?>" id="<?php echo esc_attr( $field ); ?>" value="" autocomplete="new-password" placeholder="<?php echo $saved ? esc_attr__( '•••••••• saved — leave blank to keep', 'ciel-mpesa' ) : esc_attr__( 'Not set', 'ciel-mpesa' ); ?>" />
				<?php if ( $saved ) : ?>
					<label style="margin-left:8px"><input type="checkbox" name="<?php echo esc_attr( $field ); ?>_clear" value="1" /> <?php esc_html_e( 'Clear', 'ciel-mpesa' ); ?></label>
				<?php endif; ?>
				<?php if ( ! empty( $data['description'] ) ) : ?><p class="description"><?php echo esc_html( $data['description'] ); ?></p><?php endif; ?>
			</td>
		</tr>
		<?php
		return ob_get_clean();
	}

	public function validate_ciel_secret_field( $key, $value ) {
		$field = $this->get_field_key( $key );
		if ( ! empty( $_POST[ $field . '_clear' ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification -- WooCommerce verifies the settings nonce.
			return '';
		}
		$value = trim( (string) wp_unslash( $value ) );
		return '' === $value ? (string) $this->get_option( $key ) : $value;
	}

	public function generate_ciel_callback_html( $key, $data ) {
		ob_start();
		?>
		<tr valign="top">
			<th scope="row" class="titledesc"><?php echo esc_html( $data['title'] ); ?></th>
			<td class="forminp">
				<code style="display:inline-block;word-break:break-all"><?php echo esc_html( preg_replace( '#/callback/[^/]+$#', '/callback/••••••••', self::callback_url() ) ); ?></code>
				<p class="description"><?php esc_html_e( 'Sent automatically with every payment request; you do not need to paste it into the Daraja portal. It ends in a secret that only this site knows. It must be reachable over https in production.', 'ciel-mpesa' ); ?></p>
				<label><input type="checkbox" name="<?php echo esc_attr( $this->get_field_key( $key ) ); ?>_regen" value="1" /> <?php esc_html_e( 'Generate a new callback secret (payments still waiting for a result will not be confirmed by callback; the status check still confirms them)', 'ciel-mpesa' ); ?></label>
			</td>
		</tr>
		<?php
		return ob_get_clean();
	}

	public function validate_ciel_callback_field( $key, $value ) {
		if ( ! empty( $_POST[ $this->get_field_key( $key ) . '_regen' ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			delete_option( self::SECRET_OPTION );
			self::callback_secret();
		}
		return '';
	}

	public function process_admin_options() {
		$ok = parent::process_admin_options();
		if ( 'production' === $this->get_option( 'environment' ) && 0 !== strpos( self::callback_url(), 'https://' ) ) {
			WC_Admin_Settings::add_error( __( 'Production needs your site on https so Safaricom can deliver payment results. M-Pesa stays unavailable at checkout until it is.', 'ciel-mpesa' ) );
		}
		if ( 'till' === $this->get_option( 'type' ) && '' === trim( (string) $this->get_option( 'till' ) ) ) {
			WC_Admin_Settings::add_error( __( 'Account type is Till: enter the till number.', 'ciel-mpesa' ) );
		}
		return $ok;
	}

	public function daraja() {
		return new Ciel_Mpesa_Daraja( array(
			'environment'     => $this->get_option( 'environment' ),
			'consumer_key'    => $this->get_option( 'consumer_key' ),
			'consumer_secret' => $this->get_option( 'consumer_secret' ),
			'shortcode'       => $this->get_option( 'shortcode' ),
			'passkey'         => $this->get_option( 'passkey' ),
			'till'            => 'till' === $this->get_option( 'type' ) ? $this->get_option( 'till' ) : '',
		) );
	}

	public function is_available() {
		if ( ! parent::is_available() ) {
			return false;
		}
		if ( 'KES' !== get_woocommerce_currency() || ! $this->daraja()->is_configured() ) {
			return false;
		}
		if ( 'production' === $this->get_option( 'environment' ) && 0 !== strpos( self::callback_url(), 'https://' ) ) {
			return false;
		}
		return true;
	}

	public function admin_options() {
		if ( 'KES' !== get_woocommerce_currency() ) {
			echo '<div class="notice notice-warning inline"><p>' . esc_html__( 'M-Pesa only works when your store currency is Kenyan shilling (KES). It is hidden at checkout until then.', 'ciel-mpesa' ) . '</p></div>';
		}
		parent::admin_options();
	}

	/* ------------------------------------------------------------------ checkout */

	public function enqueue_styles() {
		if ( is_checkout() || is_wc_endpoint_url( 'order-received' ) || is_wc_endpoint_url( 'order-pay' ) ) {
			wp_enqueue_style( 'ciel-mpesa', CIEL_MPESA_URL . 'assets/css/ciel-mpesa.css', array(), CIEL_MPESA_VERSION );
			wp_add_inline_style( 'ciel-mpesa', '.ciel-mpesa{--ciel-mpesa-accent:' . sanitize_hex_color( $this->get_option( 'accent', '#1F9D55' ) ) . '}' );
		}
	}

	public function payment_fields() {
		if ( $this->description ) {
			echo wpautop( wp_kses_post( $this->description ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		if ( 'sandbox' === $this->get_option( 'environment' ) ) {
			echo '<p class="ciel-mpesa-sandbox">' . esc_html__( 'Sandbox mode: no real money moves.', 'ciel-mpesa' ) . '</p>';
		}
		$phone = '';
		if ( WC()->customer ) {
			$phone = Ciel_Mpesa_Daraja::normalize_phone( WC()->customer->get_billing_phone() ) ? WC()->customer->get_billing_phone() : '';
		}
		?>
		<fieldset class="ciel-mpesa ciel-mpesa-fields">
			<p class="form-row form-row-wide">
				<label for="ciel_mpesa_phone"><?php esc_html_e( 'Safaricom number', 'ciel-mpesa' ); ?> <span class="required" aria-hidden="true">*</span></label>
				<input id="ciel_mpesa_phone" name="ciel_mpesa_phone" class="input-text" type="tel" inputmode="tel" autocomplete="tel" placeholder="07XX XXX XXX" value="<?php echo esc_attr( $phone ); ?>" />
			</p>
		</fieldset>
		<?php
	}

	private function posted_phone() {
		// phpcs:disable WordPress.Security.NonceVerification -- checkout nonces are verified by WooCommerce (classic) and the Store API (blocks).
		$raw = isset( $_POST['ciel_mpesa_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['ciel_mpesa_phone'] ) ) : '';
		if ( '' === $raw && isset( $_POST['billing_phone'] ) ) {
			$raw = sanitize_text_field( wp_unslash( $_POST['billing_phone'] ) );
		}
		// phpcs:enable
		return Ciel_Mpesa_Daraja::normalize_phone( $raw );
	}

	public function validate_fields() {
		if ( ! $this->posted_phone() ) {
			wc_add_notice( __( 'Enter the Safaricom number that will pay, like 0712 345 678.', 'ciel-mpesa' ), 'error' );
			return false;
		}
		return true;
	}

	private function reference_for( WC_Order $order ) {
		$prefix = preg_replace( '/[^A-Za-z0-9]/', '', (string) $this->get_option( 'reference_prefix' ) );
		$ref    = $prefix . preg_replace( '/[^A-Za-z0-9]/', '', (string) $order->get_order_number() );
		return substr( $ref ? $ref : 'Order', 0, 12 );
	}

	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );
		$phone = $this->posted_phone();
		if ( ! $order || ! $phone ) {
			wc_add_notice( __( 'Enter the Safaricom number that will pay, like 0712 345 678.', 'ciel-mpesa' ), 'error' );
			return array( 'result' => 'failure' );
		}
		if ( 'KES' !== $order->get_currency() ) {
			wc_add_notice( __( 'M-Pesa payments must be in Kenyan shillings.', 'ciel-mpesa' ), 'error' );
			return array( 'result' => 'failure' );
		}
		// STK Push takes whole shillings; round up so the store is never short.
		$amount = (int) ceil( (float) $order->get_total() - 0.000001 );
		if ( $amount < 1 || $amount > 250000 ) {
			wc_add_notice( __( 'This order total cannot be paid by M-Pesa STK Push (KES 1 to 250,000).', 'ciel-mpesa' ), 'error' );
			return array( 'result' => 'failure' );
		}
		$last = self::last_request( $order );
		if ( $last && 'pending' === $last['state'] && time() - (int) $last['at'] < self::PENDING_WAIT ) {
			wc_add_notice( __( 'A payment prompt is already waiting on your phone for this order. Approve it, or wait a minute before trying again.', 'ciel-mpesa' ), 'error' );
			return array( 'result' => 'failure' );
		}
		$res = $this->daraja()->stk_push( $phone, $amount, $this->reference_for( $order ), 'Order ' . $order->get_order_number(), self::callback_url() );
		if ( is_wp_error( $res ) ) {
			self::log( 'STK push failed for order ' . $order->get_id() . ': ' . $res->get_error_data() );
			$order->add_order_note( sprintf( __( 'M-Pesa request was not sent: %s', 'ciel-mpesa' ), $res->get_error_message() ) );
			wc_add_notice( $res->get_error_message(), 'error' );
			return array( 'result' => 'failure' );
		}
		$id       = $res['checkout_request_id'];
		$requests = Ciel_Mpesa_Gateway::requests( $order );
		$requests[ $id ] = array( 'amount' => $amount, 'phone' => Ciel_Mpesa_Daraja::mask_phone( $phone ), 'at' => time(), 'state' => 'pending', 'env' => $this->get_option( 'environment' ) );
		$order->update_meta_data( '_ciel_mpesa_requests', $requests );
		$order->add_meta_data( '_ciel_mpesa_checkout_id', $id, false );
		$order->update_meta_data( '_ciel_mpesa_last', $id );
		$order->update_meta_data( '_ciel_mpesa_state', 'pending' );
		if ( ! $order->has_status( 'pending' ) ) {
			$order->set_status( 'pending' );
		}
		$order->add_order_note( sprintf(
			/* translators: 1: amount 2: masked phone 3: environment 4: request id */
			__( 'M-Pesa prompt sent: KES %1$s to %2$s (%3$s). Waiting for the customer to enter their PIN. Request %4$s', 'ciel-mpesa' ),
			number_format_i18n( $amount ), Ciel_Mpesa_Daraja::mask_phone( $phone ), $this->get_option( 'environment' ), $id
		) );
		$order->save();
		self::log( 'STK sent for order ' . $order->get_id() . ' request ' . $id . ' amount ' . $amount );
		if ( WC()->cart ) {
			WC()->cart->empty_cart();
		}
		return array( 'result' => 'success', 'redirect' => $this->get_return_url( $order ) );
	}

	/* ------------------------------------------------------------------ results */

	/** The STK requests made for an order, keyed by CheckoutRequestID. */
	public static function requests( WC_Order $order ) {
		$r = $order->get_meta( '_ciel_mpesa_requests' );
		return is_array( $r ) ? array_filter( $r, 'is_array' ) : array();
	}

	public static function last_request( WC_Order $order ) {
		$id       = (string) $order->get_meta( '_ciel_mpesa_last' );
		$requests = Ciel_Mpesa_Gateway::requests( $order );
		return ( $id && isset( $requests[ $id ] ) ) ? array_merge( array( 'id' => $id ), $requests[ $id ] ) : null;
	}

	/**
	 * Finds the order that sent a given STK request. Works with both order storages:
	 * High-Performance Order Storage (wc_orders_meta) and classic posts (postmeta).
	 * The caller still checks that the order really holds this request id.
	 */
	public static function find_order_by_request( $checkout_request_id ) {
		global $wpdb;
		$id    = (string) $checkout_request_id;
		$hpos  = class_exists( '\Automattic\WooCommerce\Utilities\OrderUtil' ) && \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled();
		if ( $hpos ) {
			$table    = $wpdb->prefix . 'wc_orders_meta';
			$order_id = $wpdb->get_var( $wpdb->prepare( "SELECT order_id FROM {$table} WHERE meta_key = %s AND meta_value = %s ORDER BY id DESC LIMIT 1", '_ciel_mpesa_checkout_id', $id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		} else {
			$order_id = $wpdb->get_var( $wpdb->prepare( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = %s AND meta_value = %s ORDER BY meta_id DESC LIMIT 1", '_ciel_mpesa_checkout_id', $id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		}
		$order = $order_id ? wc_get_order( (int) $order_id ) : null;
		if ( ! $order ) {
			return null;
		}
		$requests = Ciel_Mpesa_Gateway::requests( $order );
		return isset( $requests[ $id ] ) ? $order : null;
	}

	/**
	 * Applies a result to an order exactly once, whichever arrives first: the callback,
	 * the customer's status check, or an admin check. Uses an option row as a lock.
	 *
	 * @param string $state  paid | cancelled | expired | failed | review | timeout
	 */
	public static function settle( $order_id, $request_id, $state, array $info, $source ) {
		$lock = 'ciel_mpesa_lock_' . md5( $request_id );
		if ( ! add_option( $lock, time(), '', false ) ) {
			if ( time() - (int) get_option( $lock ) < 30 ) {
				return 'locked';
			}
			update_option( $lock, time(), false );
		}
		try {
			$order = wc_get_order( $order_id ); // fresh copy after taking the lock
			if ( ! $order ) {
				return 'missing';
			}
			$requests = Ciel_Mpesa_Gateway::requests( $order );
			if ( ! isset( $requests[ $request_id ] ) ) {
				return 'unknown';
			}
			$req = $requests[ $request_id ];
			// A late receipt for a payment that is already complete.
			if ( 'paid' === $req['state'] ) {
				if ( 'paid' === $state && ! empty( $info['receipt'] ) && (string) $order->get_meta( '_ciel_mpesa_receipt' ) !== (string) $info['receipt'] && '' === (string) $order->get_meta( '_ciel_mpesa_receipt' ) ) {
					$requests[ $request_id ]['receipt'] = $info['receipt'];
					$order->update_meta_data( '_ciel_mpesa_requests', $requests );
					$order->update_meta_data( '_ciel_mpesa_receipt', $info['receipt'] );
					$order->set_transaction_id( $info['receipt'] );
					$order->add_order_note( sprintf( __( 'M-Pesa receipt received: %s', 'ciel-mpesa' ), $info['receipt'] ) );
					$order->save();
				}
				return 'duplicate';
			}
			// Only pending requests (or ones we stopped waiting for) can still change.
			if ( ! in_array( $req['state'], array( 'pending', 'timeout' ), true ) || ( 'timeout' === $req['state'] && 'paid' !== $state && 'review' !== $state ) ) {
				return 'duplicate';
			}
			$requests[ $request_id ]['state']  = 'timeout' === $state ? 'timeout' : $state;
			$requests[ $request_id ]['result'] = isset( $info['result_code'] ) ? $info['result_code'] : null;
			$requests[ $request_id ]['by']     = $source;
			if ( ! empty( $info['receipt'] ) ) {
				$requests[ $request_id ]['receipt'] = $info['receipt'];
			}
			$order->update_meta_data( '_ciel_mpesa_requests', $requests );
			$is_latest = (string) $order->get_meta( '_ciel_mpesa_last' ) === $request_id;
			$amount    = number_format_i18n( (float) $req['amount'] );
			$desc      = isset( $info['result_desc'] ) ? sanitize_text_field( $info['result_desc'] ) : '';

			if ( 'paid' === $state ) {
				if ( $order->is_paid() ) {
					// Money arrived twice for one order (e.g. two prompts approved). Never hide that.
					$order->update_meta_data( '_ciel_mpesa_state', 'review' );
					$order->add_order_note( sprintf( __( 'A second M-Pesa payment of KES %1$s was received for this already-paid order (receipt %2$s). Refund it from your M-Pesa portal if needed.', 'ciel-mpesa' ), $amount, $info['receipt'] ?: $request_id ) );
					$order->save();
					return 'review';
				}
				$receipt = ! empty( $info['receipt'] ) ? $info['receipt'] : ( ! empty( $req['receipt'] ) ? $req['receipt'] : '' );
				$order->update_meta_data( '_ciel_mpesa_state', 'paid' );
				if ( $receipt ) {
					$order->update_meta_data( '_ciel_mpesa_receipt', $receipt );
				}
				$order->add_order_note( sprintf(
					/* translators: 1: amount 2: receipt 3: how it was confirmed */
					__( 'M-Pesa payment confirmed: KES %1$s, receipt %2$s (confirmed by %3$s).', 'ciel-mpesa' ),
					$amount, $receipt ? $receipt : __( 'pending from callback', 'ciel-mpesa' ), $source
				) );
				$order->save();
				$order->payment_complete( $receipt ? $receipt : $request_id );
				return 'paid';
			}
			if ( 'review' === $state ) {
				$order->update_meta_data( '_ciel_mpesa_state', 'review' );
				$order->save();
				$order->update_status( 'on-hold', sprintf( __( 'M-Pesa result needs checking before shipping: %s', 'ciel-mpesa' ), $desc ) );
				return 'review';
			}
			$labels = array(
				'cancelled' => __( 'The customer cancelled the M-Pesa prompt.', 'ciel-mpesa' ),
				'expired'   => __( 'The M-Pesa prompt timed out on the phone.', 'ciel-mpesa' ),
				'failed'    => __( 'M-Pesa did not complete the payment.', 'ciel-mpesa' ),
				'timeout'   => __( 'No M-Pesa result after 5 minutes.', 'ciel-mpesa' ),
			);
			$note = $labels[ $state ] . ( $desc ? ' (' . $desc . ')' : '' );
			if ( $is_latest && $order->needs_payment() ) {
				$order->update_meta_data( '_ciel_mpesa_state', $state );
				$order->save();
				$order->update_status( 'failed', $note . ' ' . __( 'The customer can pay again from their order page.', 'ciel-mpesa' ) );
			} else {
				$order->save();
				$order->add_order_note( $note );
			}
			return $state;
		} finally {
			delete_option( $lock );
		}
	}

	/**
	 * Checks a pending request with Daraja (used by the status endpoint and the admin action).
	 */
	public static function check_with_daraja( WC_Order $order, $request_id, $source = 'query' ) {
		$gw = self::instance();
		$q  = $gw->daraja()->stk_query( $request_id );
		if ( is_wp_error( $q ) ) {
			self::log( 'Query failed for ' . $request_id . ': ' . $q->get_error_data() );
			return 'pending';
		}
		if ( 'pending' === $q['state'] ) {
			return 'pending';
		}
		$requests = Ciel_Mpesa_Gateway::requests( $order );
		if ( 'paid' !== $q['state'] && isset( $requests[ $request_id ]['cb'] ) && '0' === $requests[ $request_id ]['cb'] ) {
			// The callback said paid; Daraja now says otherwise. A person must decide.
			return self::settle( $order->get_id(), $request_id, 'review', array( 'result_code' => $q['result_code'], 'result_desc' => 'Callback said paid but the query said ' . $q['state'] ), $source );
		}
		return self::settle( $order->get_id(), $request_id, $q['state'], array( 'result_code' => $q['result_code'], 'result_desc' => $q['result_desc'] ), $source );
	}

	public static function instance() {
		$gws = WC()->payment_gateways() ? WC()->payment_gateways()->payment_gateways() : array();
		return isset( $gws['ciel_mpesa'] ) ? $gws['ciel_mpesa'] : new self();
	}

	public static function log( $message ) {
		$gw = self::instance();
		if ( 'yes' === $gw->get_option( 'debug' ) && function_exists( 'wc_get_logger' ) ) {
			wc_get_logger()->info( $message, array( 'source' => 'ciel-mpesa' ) );
		}
	}

	/* ------------------------------------------------------------------ thank-you page */

	public function thankyou_panel( $order_id ) {
		static $shown = array();
		if ( isset( $shown[ $order_id ] ) ) {
			return;
		}
		$order = wc_get_order( $order_id );
		if ( ! $order || $order->get_payment_method() !== $this->id ) {
			return;
		}
		$shown[ $order_id ] = true;
		$last = self::last_request( $order );
		wp_enqueue_script( 'ciel-mpesa-status', CIEL_MPESA_URL . 'assets/js/status.js', array(), CIEL_MPESA_VERSION, true );
		wp_localize_script( 'ciel-mpesa-status', 'cielMpesaStatus', array(
			'url'      => esc_url_raw( rest_url( 'ciel-mpesa/v1/status' ) ),
			'order'    => $order->get_id(),
			'key'      => $order->get_order_key(),
			'payUrl'   => esc_url_raw( $order->get_checkout_payment_url() ),
			'interval' => 4000,
			'i18n'     => array(
				'pending'   => __( 'Check your phone and enter your M-Pesa PIN. This page updates when M-Pesa confirms.', 'ciel-mpesa' ),
				'paid'      => __( 'Payment confirmed by M-Pesa. Thank you!', 'ciel-mpesa' ),
				'review'    => __( 'We received a payment response that needs checking. We will confirm your order shortly.', 'ciel-mpesa' ),
				'cancelled' => __( 'The payment prompt was cancelled. No money was taken.', 'ciel-mpesa' ),
				'expired'   => __( 'The payment prompt timed out. No money was taken.', 'ciel-mpesa' ),
				'failed'    => __( 'M-Pesa did not complete the payment. No money was taken.', 'ciel-mpesa' ),
				'timeout'   => __( 'We did not get a result from M-Pesa. If you approved the payment, it will still be matched to your order.', 'ciel-mpesa' ),
				'retry'     => __( 'Pay again', 'ciel-mpesa' ),
				'receipt'   => __( 'M-Pesa receipt', 'ciel-mpesa' ),
			),
		) );
		$state = $order->is_paid() ? 'paid' : ( $last ? $last['state'] : 'pending' );
		echo '<section class="ciel-mpesa ciel-mpesa-status" data-state="' . esc_attr( $state ) . '" aria-live="polite">';
		echo '<span class="ciel-mpesa-badge">M-PESA</span>';
		echo '<div class="ciel-mpesa-status__body"><strong class="ciel-mpesa-status__title"></strong><p class="ciel-mpesa-status__msg"></p></div>';
		echo '</section>';
	}
}
