import { MoxyServer } from '@acrontum/moxy';

const moxy = new MoxyServer({ router: { allowHttpRouteConfig: true } });

// transparent proxy moxy -> google
moxy.on('/(?<path>.*)', {
  proxy: 'https://www.google.ca/:path'
});

moxy.listen(5000);

/*

open http://localhost:5000/search?q=acrontum/moxy

since we allowed httpConfig, we can do this from the browser devtools:

fetch('http://localhost:5000/_moxy/routes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: '/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
    config: {
      proxy: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Canada_%28Pantone%29.svg/255px-Flag_of_Canada_%28Pantone%29.svg.png'
    }
  })
});

and now when we refresh, the google logo is a Canada flag (much better, eh?)
*/
