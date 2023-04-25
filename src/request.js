import axios from 'axios';

const baseURL = 'http://localhost:3001'

export const uploadFiles = (url,formData,onUploadProgress = () => {}) => {
    return axios({
        method: 'post',
        url,
        baseURL,
        data:formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
    })
}

export const mergeChunks = (url,data) => {
    return axios({
        method: 'post',
        url,
        baseURL,
        data,
        headers: {
            'Content-Type': 'application/json'
        }
    })
}