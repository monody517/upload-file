<script setup lang="ts">
import * as SparkMD5 from 'spark-md5';
import {uploadFiles, mergeChunks, verifyFile} from './request.js';
import {computed, ref} from "vue";

//  默认分块文件大小
const DefaultChunkSize = 5 * 1024 * 1024

//  当前处理分块文件
const currFile = ref({})

//  当前分块列表
const fileChunkList = ref([])

const fileChange = async (event) => {
    const [file] = event.target.files
    if(!file) return
    currFile.value = file
    fileChunkList.value = []
    let {fileHash} = await getFileChunk(file)
    uploadFileChunks(fileHash);
}

//  获取文件分块
const getFileChunk = async (file,chunkSize = DefaultChunkSize) => {
    const verifyData = await verifyFile('api/files/verify',{filename: currFile.value.name})
    if(!verifyData.data.data){
        window.alert(verifyData.data.message)
        return
    }
    return new Promise((resovle)=>{
        let blobSlice = File.prototype.slice,
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = [],
            spark = new SparkMD5.ArrayBuffer(),
            fileReader = new FileReader();
        fileReader.onload = function (e) {
            console.log('read chunk nr', currentChunk + 1, 'of');
            const chunk = e.target.result;
            spark.append(chunk);
            currentChunk++;
            if (currentChunk < chunks) {
                loadNext();
            } else {
                let fileHash = spark.end();
                console.info('finished computed hash', fileHash);
                resovle({ fileHash });
            }
        };

        fileReader.onerror = function () {
            console.warn('oops, something went wrong.');
        };

        function loadNext() {
            let start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
            let chunk = blobSlice.call(file, start, end);
            fileChunkList.value.push({ chunk, size: chunk.size, name: currFile.value.name });
            fileReader.readAsArrayBuffer(chunk);
        }
        loadNext();
    })
}

// 总进度条
const totalPercentage = computed(() => {
    if (!fileChunkList.value.length) return 0;
    const loaded = fileChunkList.value
        .map(item => item.size * item.percentage)
        .reduce((curr, next) => curr + next);
    return parseInt((loaded / currFile.value.size).toFixed(2));
})

// 分块进度条
const onUploadProgress = (item) => (e) => {
    item.percentage = parseInt(String((e.loaded / e.total) * 100));
}

//  上传文件
const uploadFileChunks = (fileHash) => {
    const requests = fileChunkList.value.map((item,index)=> {
        const formData = {}
        formData[`${currFile.value.name}-${fileHash}-${index}`] = item.chunk
        formData['filename'] = currFile.value.name
        formData['hash'] = `${fileHash}-${index}`
        formData['fileHash'] = fileHash
        return uploadFiles('/api/files/upload',formData,onUploadProgress(item))
    })

    Promise.all(requests).then(() => {
        // 合并请求
        mergeChunks('/api/files/merge', { size: DefaultChunkSize, filename: currFile.value.name });
    });
}
</script>

<template>
<!--    <h1>大文件上传</h1>-->
    <input type="file" @change="fileChange"/>

    <h2>总进度：{{ totalPercentage }} %</h2>

    <div class="percentage total">
        <p class="bg" :style="`width:${totalPercentage || 0}%`"></p>
    </div>

    <div class="progress" v-if="fileChunkList.length">
        <div class="progress-chunk" v-for="(item, index) in fileChunkList">
            <div class="clonm flex-1">{{ item.name }}_{{ index }}</div>
            <div class="clonm size">{{ item.size }} kb</div>
            <div class="clonm flex-1">
                <div class="percentage">
                    <p class="bg" :style="`width:${item.percentage || 0}%`"></p>
                </div>
                <span class="text">{{ item.percentage || 0 }}%</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
* {
    margin: 0;
    padding: 0;
}
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}
h1,
h2 {
    margin: 20px;
    width: 90%;
}
.total {
    width: 91%;
    margin: auto;
}
.progress {
    width: 90%;
    margin: 20px auto;
    border: 1px solid #0677e9;
    padding: 10px;
}
.progress-chunk {
    display: flex;
    padding: 10px 0;
    border-bottom: 1px solid #c5d1dd;
}
.clonm {
    display: flex;
    align-items: center;
    word-break: break-word;
    text-align: center;
}
.size {
    width: 200px;
}
.flex-1 {
    flex: 1;
}
.percentage {
    flex: 1;
    background-color: #bdc1c5;
    border-radius: 3px;
    height: 6px;
    display: flex;
    align-items: center;
}
.bg {
    height: 100%;
    width: 0%;
    border-radius: 3px;
    background: rgb(22, 245, 2);
}
.text {
    width: 45px;
    padding: 0 5px;
}
</style>
