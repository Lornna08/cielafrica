<?php
/**
 * Registers the gateway with the block-based Cart and Checkout.
 */
defined( 'ABSPATH' ) || exit;

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

final class Ciel_Mpesa_Blocks extends AbstractPaymentMethodType {

	protected $name = 'ciel_mpesa';
	private $gateway;

	public function initialize() {
		$this->settings = get_option( 'woocommerce_ciel_mpesa_settings', array() );
		$this->gateway  = Ciel_Mpesa_Gateway::instance();
	}

	public function is_active() {
		return $this->gateway && $this->gateway->is_available();
	}

	public function get_payment_method_script_handles() {
		wp_register_script( 'ciel-mpesa-blocks', CIEL_MPESA_URL . 'assets/js/blocks.js', array( 'wc-blocks-registry', 'wc-settings', 'wp-element', 'wp-html-entities' ), CIEL_MPESA_VERSION, true );
		wp_enqueue_style( 'ciel-mpesa', CIEL_MPESA_URL . 'assets/css/ciel-mpesa.css', array(), CIEL_MPESA_VERSION );
		wp_add_inline_style( 'ciel-mpesa', '.ciel-mpesa{--ciel-mpesa-accent:' . sanitize_hex_color( $this->get_setting( 'accent', '#1F9D55' ) ) . '}' );
		return array( 'ciel-mpesa-blocks' );
	}

	public function get_payment_method_data() {
		$phone = ( function_exists( 'WC' ) && WC()->customer ) ? (string) WC()->customer->get_billing_phone() : '';
		return array(
			'title'       => $this->get_setting( 'title', __( 'M-Pesa', 'ciel-mpesa' ) ),
			'description' => $this->get_setting( 'description' ),
			'sandbox'     => 'production' !== $this->get_setting( 'environment' ),
			'phone'       => Ciel_Mpesa_Daraja::normalize_phone( $phone ) ? $phone : '',
			'supports'    => $this->gateway ? array_filter( $this->gateway->supports, array( $this->gateway, 'supports' ) ) : array( 'products' ),
			'i18n'        => array(
				'label'   => __( 'Safaricom number', 'ciel-mpesa' ),
				'invalid' => __( 'Enter the Safaricom number that will pay, like 0712 345 678.', 'ciel-mpesa' ),
				'sandbox' => __( 'Sandbox mode: no real money moves.', 'ciel-mpesa' ),
			),
		);
	}
}
