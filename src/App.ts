import Livestorm from '@livestorm/plugin';

const appTpl = require('./templates/app.html').default;

const productModalTpl = require('./templates/product-modal-paypal.html').default;

export default async function () {

    const { is_host } = await Livestorm.Users.me();

    let paymentProvider = JSON.parse(
        await Livestorm.Storage.getItem('paymentProvider') ||
        "{ \"provider\": \"paypal\", \"clientId\": \"\" }");

    const persistProducts = async products => {
        await Livestorm.Storage.setItem('sellerPluginData', JSON.stringify(products));
    };

    const shareProduct = async product => {

        console.log("Publishing", product);
        Livestorm.PubSub.publish('shareProduct', { data: product });

    };

    Livestorm.PubSub.subscribe('shareProduct', async product => {

        console.log("Got shareProduct", product);

        //comment this if you want to try the sharing as host
        if(is_host)
            return console.log("Ignoring share product request since you are the host");

        Livestorm.Modal.showIframe({
            template: productModalTpl,
            variables: {
                productName: product.name,
                productDescription: product.description,
                productCurrency: product.currency,
                productPrice: product.price,
                productShippingCost: product.shippingCost,
                paypalClientId: paymentProvider['clientId']
            },
            onMessage: message => {
                console.log("Data from iframe", { message });
            }
        });

    });


    Livestorm.Stage.Buttons.registerShareButton({
        label: 'Live seller',
        imageSource: 'https://livestorm-ireland-plugin-assets.s3-eu-west-1.amazonaws.com/5d0fc077-c9ee-47b6-9bee-4f2f59c6d859/logo-small.png',
        onClick: async () => {

            const products = JSON.parse(await Livestorm.Storage.getItem('sellerPluginData') || "[]");

            Livestorm.Modal.showIframe({
                template: appTpl,
                variables: {
                    paypalClientId: paymentProvider['clientId'],
                    sectionTitle: '{{sectionTitle}}',
                    products: JSON.stringify(products),
                    product: { name: '{{product.name}}', description: '{{product.description}}' },
                    productDigitalGood: 'product.digitalGood'
                },
                onMessage: async (message) => {

                    console.log("Data from iframe", { message });

                    if(message['cmd'] === 'saveAndShareProduct') {

                        products.push(message['data']);
                        await persistProducts(products);
                        await shareProduct(message['data']);

                    }
                    else if(message['cmd'] === 'shareProduct') {
                        await shareProduct(message['data']);
                    }
                    else if(message['cmd'] === 'deleteProduct') {

                        products.splice(message['data']['index'], 1);
                        await persistProducts(products);

                    }
                    else if(message['cmd'] === 'savePaymentProvider') {

                        await Livestorm.Storage.setItem('paymentProvider', JSON.stringify(message['data']));
                        paymentProvider = message['data'];
                    }
                }
            });

        }
    })

}