import { createFileRoute } from '@tanstack/react-router'

/**
 * API Documentation Route
 *
 * Serves the Swagger UI for interactive API documentation.
 * The OpenAPI spec is loaded from /docs/api/openapi.yaml
 */
export const Route = createFileRoute('/api-docs' as any)({
  component: ApiDocs,
})

function ApiDocs() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Training Certify API Documentation</title>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"
        />
        <style>
          {`
            html {
              box-sizing: border-box;
              overflow: -moz-scrollbars-vertical;
              overflow-y: scroll;
            }
            *, *:before, *:after {
              box-sizing: inherit;
            }
            body {
              margin: 0;
              background: #fafafa;
            }
          `}
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
        {/* Static Swagger UI bootstrap only — not user-controlled HTML */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onload = function() {
                SwaggerUIBundle({
                  url: '/docs/api/openapi.yaml',
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                  ],
                  plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                  ],
                  layout: "StandaloneLayout",
                  tryItOutEnabled: true,
                  supportedSubmitMethods: ['get', 'post', 'put', 'patch', 'delete'],
                  validatorUrl: null,
                  onComplete: function() {}
                });
              };
            `,
          }}
        />
      </body>
    </html>
  )
}
