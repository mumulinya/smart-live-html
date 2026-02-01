import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    // Core
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/home/Index.vue'),
        meta: { keepAlive: true }
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import('@/views/search/Index.vue')
    },
    {
        path: '/map',
        name: 'Map',
        component: () => import('@/views/map/Index.vue')
    },
    {
        path: '/ai',
        name: 'AI',
        component: () => import('@/views/ai/index.vue')
    },

    // User Module
    {
        path: '/user/login',
        name: 'Login',
        component: () => import('@/views/user/auth/Login.vue')
    },
    {
        path: '/user/profile',
        name: 'UserProfile',
        alias: ['/info', '/user/info'],
        component: () => import('@/views/user/profile/Info.vue')
    },
    {
        path: '/user/profile/:id',
        name: 'OtherProfile',
        alias: '/user-info/:id',
        component: () => import('@/views/user/profile/OtherInfo.vue')
    },
    {
        path: '/user/edit',
        name: 'UserEdit',
        component: () => import('@/views/user/profile/Edit.vue')
    },
    {
        path: '/user/add-friend',
        name: 'AddFriend',
        component: () => import('@/views/user/social/AddFriend.vue')
    },
    {
        path: '/user/star',
        name: 'UserStar',
        component: () => import('@/views/user/content/MyStar.vue')
    },
    {
        path: '/user/follow',
        name: 'MyFollow',
        component: () => import('@/views/user/social/MyFollow.vue')
    },
    {
        path: '/review/mine',
        name: 'MyReviews',
        component: () => import('@/views/review/MyReviews.vue')
    },
    {
        path: '/review/drafts',
        name: 'MyDrafts',
        component: () => import('@/views/review/Drafts.vue')
    },
    {
        path: '/drafts',
        name: 'Drafts',
        component: () => import('@/views/draft/Index.vue')
    },
    {
        path: '/user/my-reviews',
        redirect: '/review/mine'
    },
    {
        path: '/user/list',
        name: 'UserList',
        component: () => import('@/views/user/social/UserList.vue'),
        props: route => ({ type: route.query.type })
    },
    {
        path: '/user/moments',
        name: 'MyMoments',
        component: () => import('@/views/user/content/MyMoments.vue')
    },
    {
        path: '/user/password/update',
        name: 'UpdatePassword',
        component: () => import('@/views/user/auth/UpdatePassword.vue')
    },
    {
        path: '/user/password/set',
        name: 'SetPassword',
        component: () => import('@/views/user/auth/SetPassword.vue')
    },

    // Shop Module
    {
        path: '/shop/list',
        name: 'ShopList',
        component: () => import('@/views/shop/List.vue')
    },
    {
        path: '/shop/detail',
        name: 'ShopDetail',
        component: () => import('@/views/shop/Detail.vue')
    },

    // Blog Module
    {
        path: '/blog/detail',
        name: 'BlogDetail',
        component: () => import('@/views/blog/Detail.vue')
    },
    {
        path: '/blog/edit',
        name: 'BlogEdit',
        component: () => import('@/views/blog/Edit.vue')
    },

    // Trade (Order/Voucher) Module
    {
        path: '/order/list',
        name: 'OrderList',
        component: () => import('@/views/order/List.vue')
    },
    {
        path: '/order/detail',
        name: 'OrderDetail',
        component: () => import('@/views/order/Detail.vue')
    },
    {
        path: '/voucher/detail',
        name: 'VoucherDetail',
        component: () => import('@/views/voucher/Detail.vue')
    },

    // Social (Chat/Comment) Module
    {
        path: '/chat/list',
        name: 'ChatList',
        component: () => import('@/views/chat/List.vue')
    },
    {
        path: '/chat/detail',
        name: 'ChatDetail',
        component: () => import('@/views/chat/Detail.vue')
    },
    {
        path: '/chat/info',
        name: 'ChatInfo',
        component: () => import('@/views/chat/ChatInfo.vue')
    },
    {
        path: '/chat/history-calendar',
        name: 'ChatHistoryCalendar',
        component: () => import('@/views/chat/ChatHistoryCalendar.vue')
    },
    {
        path: '/comment/list',
        name: 'CommentList',
        component: () => import('@/views/comment/List.vue')
    },
    {
        path: '/review/detail',
        name: 'ReviewDetail',
        component: () => import('@/views/review/Detail.vue')
    },
    {
        path: '/review/publish',
        name: 'ReviewPublish',
        component: () => import('@/views/review/Publish.vue')
    },
    {
        path: '/review/wait',
        redirect: '/review/mine?tab=pending'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
