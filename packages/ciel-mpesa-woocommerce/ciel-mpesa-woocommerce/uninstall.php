<?php
/**
 * Removes the plugin's settings. Orders, order notes and payment records are kept:
 * they are your accounting history.
 */
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;
delete_option( 'woocommerce_ciel_mpesa_settings' );
delete_option( 'ciel_mpesa_callback_secret' );
