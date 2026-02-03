import request from '@/utils/request'

// 搜索用户相关数据 (笔记/店铺/代金券)
export function searchUser(params) {
  return request({
    url: '/app/search/user',
    method: 'get',
    params
  })
}

// 添加搜索历史
export function addSearchHistory(data) {
  return request({
    url: '/app/search/user/history',
    method: 'post',
    params: data // Using params because backend controller uses @RequestParam for POST
  })
}

// 获取搜索历史
export function getSearchHistory(params) {
  return request({
    url: '/app/search/user/history',
    method: 'get',
    params
  })
}

// 清空搜索历史
export function clearSearchHistory(params) {
  return request({
    url: '/app/search/user/history',
    method: 'delete',
    params
  })
}
