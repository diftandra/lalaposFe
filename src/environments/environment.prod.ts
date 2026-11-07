// Production build. Override urlHost to the real backend address when deploying.
// The backend serves endpoints at the root, e.g. {urlHost}/lala-pos/...
export const environment = {
  production: true,
  urlHost: "http://localhost:8080"
};
