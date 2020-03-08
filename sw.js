/*
*
*  Push Notifications codelab
*  Copyright 2015 Google Inc. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      https://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License
*
*/

/* eslint-env browser, serviceworker, es6 */

'use strict';

/* eslint-disable max-len */

const applicationServerPublicKey = 'BH8-hIchXKMI6AKSee8gD0hhPThRqaEhIEtMJwcTjEQhiOKdG-_2tTIO-6hOAK4kwg5M9Saedjxp4hVE-khhWxY';

/* eslint-enable max-len */

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Push Notification Event Handler
self.addEventListener('push', function (event) {

  // Push Received
  event.waitUntil(

    // Check app page open
    self.clients.matchAll({ // Line 50
      includeUncontrolled: true, // Error occuring when enabling this
      type: 'window'
    })
      .then(function (windowClients) {
        debugger
        // If no page instances show notification
        if (!windowClients.length) {

          // Get subscription key to call api
          return self.registration
            .pushManager
            .getSubscription()
            .then(function (subscription) {
              if (subscription) {

                // Get push message data
                var token = encodeURIComponent(String(subscription.endpoint).split('/').pop());
                var url = 'api/push/data?token=' + token + '&type=' + getPushDeviceType();
                return self.fetch(url, { credentials: 'include' })
                  .then(function (response) {

                    if (response.status === 200) {
                      return response.json()
                        .then(function (data) {
                          if (data) {

                            // Display notification
                            return self.registration
                              .showNotification('App Notifications', {
                                'body': data.msg,
                                'icon': data.img,
                                'tag': 'app'
                              });
                          } else {
                            return;
                          }
                        });
                    } else {
                      return;
                    }
                  });
              } else {
                return;
              }
            });
        } else {
          return;
        }
      })
  );
});


// self.addEventListener('push', function (event) {
//   event.waitUntil(

//     self.clients.matchAll().then(function (clientList) {

//       var focused = clientList.some(function (client) {
//         return client.focused;
//       });

//       var notificationMessage;
//       if (focused) {
//         notificationMessage = 'You\'re still here, thanks!';
//       } else if (clientList.length > 0) {
//         notificationMessage = 'You haven\'t closed the page, ' +
//           'click here to focus it!';
//       } else {
//         notificationMessage = 'You have closed the page, ' +
//           'click here to re-open it!';
//       }
//       return self.registration.showNotification('ServiceWorker Cookbook', {
//         body: notificationMessage,
//       });

//     })
//   );
// });


self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://developers.google.com/web/')
  );
});

self.addEventListener('pushsubscriptionchange', function (event) {
  console.log('[Service Worker]: \'pushsubscriptionchange\' event fired.');
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })
      .then(function (newSubscription) {
        // TODO: Send to application server
        console.log('[Service Worker] New subscription: ', newSubscription);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim().then(() => {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Clients/matchAll
    return self.clients.matchAll({ type: 'window' });
  }).then(clients => {
    return clients.map(client => {
      // Check to make sure WindowClient.navigate() is supported.
      if ('navigate' in client) {
        return client.navigate('activated.html');
      }
    });
  }));
});
