import request from '@/utils/request';

export function uploadFile(formData) {
    return request.post('/app/file/appUpload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
}

export function deleteFile(name) {
    return request.get('/app/file/appDelete', { params: { name } });
}
