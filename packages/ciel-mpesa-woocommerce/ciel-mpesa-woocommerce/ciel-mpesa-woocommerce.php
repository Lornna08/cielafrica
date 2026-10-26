<?php
/**
 * Plugin Name:       Ciel M-Pesa for WooCommerce
 * Plugin URI:        https://cielafrica.com/products/ciel-mpesa-woocommerce
 * Description:       M-Pesa STK Push (Lipa na M-Pesa Online) payments for WooCommerce checkout, using your own Safaricom Daraja app.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      8.0
 * Author:            Ciel Africa
 * Author URI:        https://cielafrica.com
 * License:           Commercial — see LICENSE.txt
 * Text Domain:       ciel-mpesa
 * WC requires at least: 8.2
 * WC tested up to:   11.2
 *
 * M-Pesa is a trademark of Safaricom PLC. Ciel Africa is not affiliated with or endorsed by Safaricom.
 */

defined( 'ABSPATH' ) || exit;

define( 'CIEL_MPESA_VERSION', '1.0.0' );
define( 'CIEL_MPESA_FILE', __FILE__ );
define( 'CIEL_MPESA_DIR', plugin_dir_path( __FILE__ ) );
define( 'CIEL_MPESA_URL', plugin_dir_url( __FILE__ ) );

// Declare compatibility with High-Performance Order Storage and the block-based checkout.
add_action( 'before_woocommerce_init', function () {
	if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', __FILE__, true );
	}
} );

add_action( 'plugins_loaded', function () {
	if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
		add_action( 'admin_notices', function () {
			echo '<div class="notice notice-error"><p>' . esc_html__( 'Ciel M-Pesa for WooCommerce needs WooCommerce to be installed and active.', 'ciel-mpesa' ) . '</p></div>';
		} );
		return;
	}
	require_once CIEL_MPESA_DIR . 'includes/class-ciel-mpesa-daraja.php';
	require_once CIEL_MPESA_DIR . 'includes/class-ciel-mpesa-gateway.php';
	require_once CIEL_MPESA_DIR . 'includes/class-ciel-mpesa-rest.php';

	add_filter( 'woocommerce_payment_gateways', function ( $gateways ) {
		$gateways[] = 'Ciel_Mpesa_Gateway';
		return $gateways;
	} );
	Ciel_Mpesa_Rest::init();
}, 11 );

// Block-based checkout support.
add_action( 'woocommerce_blocks_loaded', function () {
	if ( ! class_exists( '\Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
		return;
	}
	require_once CIEL_MPESA_DIR . 'includes/class-ciel-mpesa-blocks.php';
	add_action( 'woocommerce_blocks_payment_method_type_registration', function ( $registry ) {
		$registry->register( new Ciel_Mpesa_Blocks() );
	} );
} );

add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), function ( $links ) {
	$url = admin_url( 'admin.php?page=wc-settings&tab=checkout&section=ciel_mpesa' );
	array_unshift( $links, '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'ciel-mpesa' ) . '</a>' );
	return $links;
} );
