import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/CleanLayout.vue'),
    children: [{ path: '', component: () => import('pages/CameraPage.vue') }],
  },
  {
    path: '/camera',
    component: () => import('layouts/CleanLayout.vue'),
    children: [{ path: '', component: () => import('pages/CameraPage.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
