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
      open_in_tab: true,
    },
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
