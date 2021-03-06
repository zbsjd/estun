/**
 * vue路由
 * Created at 2020/5/21 10:07
 *
 * @author DaiHai
 * @version 1.0
 */

import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
const material = () => import('../views/Material')
const userInfo = () => import('../views/UserInfo')
const authority = () => import('../views/Authority')
const login = () => import('../views/Login')
const retrievePassword = () => import('../views/RetrievePassword')
const home = () => import('../components/Home')
const homeUpdatePass = () => import('../views/HomeUpdatePass')
const supplier = () => import('../views/Supplier')
const logger = () => import('../views/Logger')
const personalInfo = () => import('../views/PersonalInfo')
const order = () => import('../views/Order')
const customer = () => import('../views/Customer')
const price = () => import('../views/Price')


const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        component:resolve => require(['../views/Login'],resolve)
    },
    {
        path: '/retrievePassword',
        component: resolve => require(['../views/RetrievePassword'],resolve)
    },
    {
        path: '/home',
        redirect: '/userInfo',
        component: resolve => require(['../components/Home'],resolve),
        children: [
            { //人员管理
                path: '/userInfo',
                meta: {
                    name: '人员管理',
                    comp: 'userInfo'
                },
                component: resolve => require(['../views/UserInfo'],resolve),
            },
            { //权限管理
                path: '/authority',
                meta: {
                    name: '权限管理',
                    comp: 'authority'
                },
                component: resolve => require(['../views/Authority'],resolve),
            },
            { //物料管理
                path: '/material',
                meta: {
                    name: '物料管理',
                    comp: 'material'
                },
                component: resolve => require(['../views/Material'],resolve),
            },
            { //修改密码
                path: '/homeUpdatePass',
                meta: {
                    name: '修改密码',
                    comp: 'homeUpdatePass'
                },
                component: resolve => require(['../views/HomeUpdatePass'],resolve),
            },
            { //供货商管理
                path: '/supplier',
                meta: {
                    name: '供货商管理',
                    comp: 'supplier'
                },
                component: resolve => require(['../views/Supplier'],resolve),
            },
            { //客户管理
                path: '/customer',
                meta: {
                    name: '客户管理',
                    comp: 'customer'
                },
                component: resolve => require(['../views/Customer'],resolve),
            },
            { //日志管理
                path: '/logger',
                meta: {
                    name: '日志查询',
                    comp: 'logger'
                },
                component: resolve => require(['../views/Logger'],resolve),
            }
            ,
            { //个人信息
                path: '/personalInfo',
                meta: {
                    name: '个人信息',
                    comp: 'personalInfo'
                },
                component: resolve => require(['../views/PersonalInfo'],resolve),
            } ,
            { //下单管理
                path: '/order',
                meta: {
                    name: '下单管理',
                    comp: 'order'
                },
                component: resolve => require(['../views/Order'],resolve),
            } ,
            { //价格管理
                path: '/price',
                meta: {
                    name: '价格管理',
                    comp: 'price'
                },
                component: resolve => require(['../views/Price'],resolve),
            }


        ]
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

/*
* 全局前置路由
* */
router.beforeEach((to, from, next) => {
    debugger
    //校验是否找回密码
    console.info("进入全局前置路由"+to.path);
    if (to.path == '/retrievePassword') {
        next()
        //校验是否登录，防止不登录，直接进入其他页面
    } else if ((to.path == '/login' && from.path === '/') || (to.path == '/userInfo' && from.path === '/login')) {
        next()
    } else {
        if (sessionStorage.getItem('profile') === null) {
            next('/login')
        } else {
            next()
        }
    }
})


//重写路由的push方法
const routerPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
    return routerPush.call(this, location).catch(error => error)
}

export default router
