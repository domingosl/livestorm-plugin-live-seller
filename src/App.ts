import Livestorm from '@livestorm/plugin'
const shareProductTpl = require('./templates/share-product.html').default

export default function() {

/*
  Livestorm
      .Chat
      .broadcast(
          {
            html: "<p>Ciao mondo!, <a href='https://google.com' target='_blank'>the link 2</a></p>"
          });
*/

  console.log("Event type id", Livestorm.Configuration.eventTypeId, "Org ID", Livestorm.Configuration.organizationId, "Session ID", Livestorm.Configuration.sessionId);

    Livestorm.When.eventStarts(() => {
        // do something
    })

  Livestorm.Stage.Buttons.registerShareButton({
    label: 'Share a Product',
    imageSource: 'https://livestorm-ireland-plugin-assets.s3-eu-west-1.amazonaws.com/5d0fc077-c9ee-47b6-9bee-4f2f59c6d859/logo-small.png',
    onClick: () => {

        Livestorm.Modal.showIframe({
            template: shareProductTpl,
            variables: { content: 'hello' },
            //size: 'normal',
            onMessage: (message) => console.log(message)
        });

    }
  })

}