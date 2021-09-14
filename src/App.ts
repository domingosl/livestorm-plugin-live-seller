import Livestorm from '@livestorm/plugin';

const appTpl = require('./templates/app.html').default;

const productModalTpl = require('./templates/product-modal-redirect.html').default;
//const productModalTpl = require('./templates/product-modal-no-redirect.html').default;

const paymentsPageURL = "https://livestorm-ireland-plugin-assets.s3-eu-west-1.amazonaws.com/a0ac924c-ce41-4e3d-9a29-b6f05a01ec8c/payment-page.html";

export default async function () {

    const { is_host } = await Livestorm.Users.me();


/*    Livestorm.PubSub.subscribe('webhook', (payload) => {
        console.log(">>>", payload);
        Livestorm.NotificationCenter.showIframe('<div class="ls-text-XX-medium" style="padding: 5px 10px; background: white; border-radius: 10px; text-align: center">New info from webhook! {{ content }}</div>', { content: JSON.stringify(payload) });
    });*/

    //console.log("Event type id", Livestorm.Configuration.eventTypeId, "Org ID", Livestorm.Configuration.organizationId, "Session ID", Livestorm.Configuration.sessionId);

    const persistProducts = async products => {
        await Livestorm.Storage.setItem('sellerPluginData', JSON.stringify(products));
    };

    const shareProduct = async product => {

        console.log("Publishing", product);
        Livestorm.PubSub.publish('shareProduct', { data: product });

    };

    Livestorm.PubSub.subscribe('shareProduct', async product => {

        console.log("Got shareProduct", product);

        Livestorm.Modal.showIframe({
            template: productModalTpl,
            variables: {
                productName: product.name,
                productDescription: product.description,
                paymentLink: paymentsPageURL + "?clientId=sb&currency=EUR&description=" + encodeURIComponent(String(product['name'])) + "&value=10&shippingCost=2&rand=" + Math.random()
            },
            onMessage: message => {
                console.log("Data from iframe", { message });
            }
        });

    });

    Livestorm.Stage.Buttons.registerShareButton({
        label: 'Share a Product',
        imageSource: 'https://livestorm-ireland-plugin-assets.s3-eu-west-1.amazonaws.com/5d0fc077-c9ee-47b6-9bee-4f2f59c6d859/logo-small.png',
        onClick: async () => {

            const products = JSON.parse(await Livestorm.Storage.getItem('sellerPluginData') || "[]");

            Livestorm.Modal.showIframe({
                template: appTpl,
                variables: {
                    sectionTitle: '{{sectionTitle}}',
                    products: JSON.stringify(products),
                    product: { name: '{{product.name}}', description: '{{product.description}}' }
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
                }
            });

        }
    })

}