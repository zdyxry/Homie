import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '__MSG_app_name__',
    description: '__MSG_app_description__',
    default_locale: 'en',
    permissions: ['activeTab', 'storage', 'unlimitedStorage', 'alarms'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Homie',
    },
    options_ui: {
      page: 'settings.html',
      open_in_tab: true,
    },
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwU/kiKs6I39izGAzMZl1+TnClF0ZJxvaESBZ5cKekA7jHj0LWtAXgd4oh+74hQWbD0tuAPLCglXPwOMuYUneOB8XJSV2y/xY3MS5XXKYvPBVw79/oveRQbiJqy3rO866sgllAbuFPwL0Imajt5wMylsiIe3ww89Y3W6dLbbYvcSgoB2R4o5pA7wa4Bp4ddo9aecHKMEgzOKgUay3PjHLeQWMo64HrJSDsIpQjZTtmxPJ5bUUaTtiG8wWKb4xIVFTbr9Wg2N5/MLHrMFMut6TLqSWJoj0aNcH/6yWwHyh5P87lIKkVYwJjbM1DU6xsBnaWjIK15J3Z0XKS/qWDMCcAwIDAQAB',
  },
  runner: {
    disabled: false,
  },
  // Vite 服务器配置 - 监听所有网络接口以支持远程开发
  vite: async () => ({
    plugins: [tailwindcss()],
    css: {
      postcss: {
        plugins: [
          (await import('postcss-rem-to-pixel')).default({
            rootValue: 16,
            propList: ['*'],
            selectorBlackList: [],
            mediaQuery: true,
            minPixelValue: 1,
          }),
        ],
      },
    },
    server: {
      host: '127.0.0.1',
      strictPort: true,
    },
  }),
});
