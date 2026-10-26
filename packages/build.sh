#!/bin/sh
# Builds the two buyer downloads into packages/dist/ (git-ignored, never deployed).
#   sh packages/build.sh
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist
( cd ciel-mpesa-stk && npm test >/dev/null )
STK_V=$(node -p "require('./ciel-mpesa-stk/package.json').version")
WC_V=$(grep -m1 "Version:" ciel-mpesa-woocommerce/ciel-mpesa-woocommerce/ciel-mpesa-woocommerce.php | awk '{print $NF}')
( cd ciel-mpesa-stk && zip -qr "../dist/ciel-mpesa-stk-$STK_V.zip" . -x "node_modules/*" "data/*" ".env" "theme.json" "*.DS_Store" )
( cd ciel-mpesa-woocommerce && zip -qr "../dist/ciel-mpesa-woocommerce-$WC_V.zip" ciel-mpesa-woocommerce -x "*.DS_Store" )
for f in dist/*.zip; do php -r "exit(0);" >/dev/null 2>&1; echo "$f  $(du -h "$f" | cut -f1)"; done
