/* Ciel M-Pesa — order-received page: shows the real payment state, polling the store. */
( function () {
	var cfg = window.cielMpesaStatus, box = document.querySelector( '.ciel-mpesa-status' );
	if ( ! cfg || ! box ) { return; }
	var title = box.querySelector( '.ciel-mpesa-status__title' ), msg = box.querySelector( '.ciel-mpesa-status__msg' ), t = cfg.i18n, started = Date.now();
	var titles = { pending: 'Waiting for M-Pesa', paid: 'Paid', review: 'Payment being checked', cancelled: 'Payment cancelled', expired: 'Payment timed out', failed: 'Payment not completed', timeout: 'No result yet', none: 'Waiting for M-Pesa' };
	function paint( state, receipt ) {
		box.setAttribute( 'data-state', state );
		title.textContent = titles[ state ] || titles.pending;
		msg.textContent = ( t[ state ] || t.pending ) + ( state === 'paid' && receipt ? ' ' + t.receipt + ': ' + receipt + '.' : '' );
		var old = box.querySelector( '.ciel-mpesa-retry' ); if ( old ) { old.remove(); }
		if ( state === 'cancelled' || state === 'expired' || state === 'failed' || state === 'timeout' ) {
			var a = document.createElement( 'a' ); a.className = 'button ciel-mpesa-retry'; a.href = cfg.payUrl; a.textContent = t.retry; box.querySelector( '.ciel-mpesa-status__body' ).appendChild( a );
		}
	}
	function done( s ) { return s !== 'pending' && s !== 'none'; }
	function tick() {
		var url = cfg.url + ( cfg.url.indexOf( '?' ) >= 0 ? '&' : '?' ) + 'order_id=' + encodeURIComponent( cfg.order ) + '&key=' + encodeURIComponent( cfg.key );
		fetch( url, { credentials: 'same-origin', cache: 'no-store' } ).then( function ( r ) { return r.json(); } ).then( function ( j ) {
			paint( j.state, j.receipt );
			if ( ! done( j.state ) && Date.now() - started < 10 * 60 * 1000 ) { setTimeout( tick, cfg.interval ); }
		} ).catch( function () { setTimeout( tick, cfg.interval * 2 ); } );
	}
	paint( box.getAttribute( 'data-state' ) || 'pending' );
	if ( ! done( box.getAttribute( 'data-state' ) ) ) { setTimeout( tick, 1500 ); }
} )();
