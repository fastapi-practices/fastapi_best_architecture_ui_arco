import { defineStore } from 'pinia';
import { Notification, NotificationReturn } from '@arco-design/web-vue';
import { RouteRecordNormalized } from 'vue-router';
import defaultSettings from '@/config/settings.json';
import { getUserMenuList } from '@/api/user';
import convertToCamelCase, { convertToKebabCase } from '@/utils/string';
import { WHITE_LIST } from '@/router/constants';
import { AppRouteRecordRaw } from '@/router/routes/types';
import DASHBOARD from '@/router/routes/modules/dashboard';
import { DEFAULT_LAYOUT } from '@/router/routes/base';
import { AppState, MenuItem } from './types';

function generateMenu(
  data: MenuItem[],
  parentName?: string
): AppRouteRecordRaw[] {
  const menuData: AppRouteRecordRaw[] = [];
  const views = import.meta.glob('@/views/**/*.vue');

  data.forEach((menu) => {
    const localeName = convertToCamelCase(menu.name);
    const path = menu.path || `${convertToKebabCase(menu.name)}`;
    const component = menu.component
      ? views[`/src/views${menu.component}`]
      : DEFAULT_LAYOUT;

    const menuItem: AppRouteRecordRaw = {
      path,
      name: menu.name,
      component,
      children: [],
      meta: {
        title: menu.title,
        roles: ['*'], // TODO: menu.perms ? menu.perms.split(',') : [],
        requiresAuth: !WHITE_LIST.some((item) => item.name === menu.name),
        icon: menu.icon,
        hideInMenu: menu.display === 0,
        ignoreCache: menu.cache === 0,
        order: menu.sort,
        locale: parentName
          ? `menu.${parentName}.${localeName}`
          : `menu.${localeName}`,
      },
    };

    if (menu.children && menu.children.length > 0) {
      menuItem.children = generateMenu(menu.children, localeName);
    }

    menuData.push(menuItem);
  });

  return menuData;
}

const useAppStore = defineStore('app', {
  state: (): AppState => ({ ...defaultSettings }),

  getters: {
    appCurrentSetting(state: AppState): AppState {
      return { ...state };
    },
    appDevice(state: AppState) {
      return state.device;
    },
    appAsyncMenus(state: AppState): RouteRecordNormalized[] {
      return state.serverMenu as unknown as RouteRecordNormalized[];
    },
  },

  actions: {
    // Update app settings
    updateSettings(partial: Partial<AppState>) {
      // @ts-ignore-next-line
      this.$patch(partial);
    },

    // Change theme color
    toggleTheme(dark: boolean) {
      this.theme = dark ? 'dark' : 'light';
      document.body.setAttribute('arco-theme', this.theme);
    },

    // Toggle device type
    toggleDevice(device: string) {
      this.device = device;
    },

    // Toggle menu visibility
    toggleMenu(value: boolean) {
      this.hideMenu = value;
    },

    // Fetch server menu configuration
    async fetchServerMenuConfig() {
      let notifyInstance: NotificationReturn | null = null;
      try {
        notifyInstance = Notification.info({
          id: 'menuNotice', // Keep the instance id the same
          content: 'loading',
          closable: true,
        });

        const data = await getUserMenuList();

        if (
          data.length === 0 ||
          !data.some((item) => item.name === 'dashboard')
        ) {
          this.serverMenu = [DASHBOARD].concat(
            generateMenu(data)
          ) as unknown as RouteRecordNormalized[];
        } else {
          this.serverMenu = generateMenu(
            data
          ) as unknown as RouteRecordNormalized[];
        }

        notifyInstance = Notification.success({
          id: 'menuNotice',
          content: 'success',
          closable: true,
        });
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        notifyInstance = Notification.error({
          id: 'menuNotice',
          content: 'error',
          closable: true,
        });
      }
    },

    // Clear server menu
    clearServerMenu() {
      this.serverMenu = [];
    },
  },
});

export default useAppStore;
