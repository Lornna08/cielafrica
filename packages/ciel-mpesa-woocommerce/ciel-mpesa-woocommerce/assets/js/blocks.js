/* Ciel M-Pesa — block checkout payment method (no build step). */
( function () {
	var registry = window.wc && window.wc.wcBlocksRegistry, settingsApi = window.wc && window.wc.wcSettings;
	if ( ! registry || ! settingsApi || ! window.wp || ! window.wp.element ) { return; }
	var el = window.wp.element.createElement, useState = window.wp.element.useState, useEffect = window.wp.element.useEffect;
	var decode = ( window.wp.htmlEntities && window.wp.htmlEntities.decodeEntities ) || function ( s ) { return s; };
	var data = settingsApi.getSetting( 'ciel_mpesa_data', {} ), t = data.i18n || {};

	function normalize( input ) {
		var p = String( input || '' ).trim().replace( /[\s\-().]/g, '' );
		if ( p.charAt( 0 ) === '+' ) { p = p.slice( 1 ); }
		if ( ! /^\d+$/.test( p ) ) { return null; }
		if ( p.charAt( 0 ) === '0' && p.length === 10 ) { p = '254' + p.slice( 1 ); }
		else if ( ( p.charAt( 0 ) === '7' || p.charAt( 0 ) === '1' ) && p.length === 9 ) { p = '254' + p; }
		return /^254(7|1)\d{8}$/.test( p ) ? p : null;
	}

	function Content( props ) {
		var st = useState( data.phone || '' ), phone = st[ 0 ], setPhone = st[ 1 ];
		var er = useState( '' ), error = er[ 0 ], setError = er[ 1 ];
		var onPaymentSetup = props.eventRegistration.onPaymentSetup, emit = props.emitResponse;
		useEffect( function () {
			return onPaymentSetup( function () {
				var n = normalize( phone );
				if ( ! n ) {
					setError( t.invalid );
					return { type: emit.responseTypes.ERROR, message: t.invalid };
				}
				setError( '' );
				return { type: emit.responseTypes.SUCCESS, meta: { paymentMethodData: { ciel_mpesa_phone: n } } };
			} );
		}, [ phone, onPaymentSetup ] );
		return el( 'div', { className: 'ciel-mpesa ciel-mpesa-fields' },
			data.description ? el( 'p', null, decode( data.description ) ) : null,
			data.sandbox ? el( 'p', { className: 'ciel-mpesa-sandbox' }, t.sandbox ) : null,
			el( 'label', { htmlFor: 'ciel-mpesa-phone-block' }, t.label ),
			el( 'input', { id: 'ciel-mpesa-phone-block', className: 'ciel-mpesa-input', type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '07XX XXX XXX', value: phone, 'aria-invalid': error ? 'true' : 'false', onChange: function ( e ) { setPhone( e.target.value ); if ( error ) { setError( '' ); } } } ),
			error ? el( 'p', { className: 'ciel-mpesa-error', role: 'alert' }, error ) : null
		);
	}

	var label = el( 'span', { className: 'ciel-mpesa-label' }, el( 'span', { className: 'ciel-mpesa-badge' }, 'M-PESA' ), ' ', decode( data.title || 'M-Pesa' ) );
	registry.registerPaymentMethod( {
		name: 'ciel_mpesa',
		label: label,
		ariaLabel: decode( data.title || 'M-Pesa' ),
		content: el( Content ),
		edit: el( Content ),
		canMakePayment: function () { return true; },
		supports: { features: data.supports || [ 'products' ] }
	} );
} )();
