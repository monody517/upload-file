export const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import(/* webpackChunkName:'Login'*/ '../App.vue'),
        meta: {
            icon: ''
        }
    },
];
