import execa from 'execa';
import http from 'http';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';


const defaultServerIp = '192.168.100.8';
const serverIpAddress = process.env.IP_ADDRESS || defaultServerIp;


console.log('Log: Get test from dealer...')
http.get(`http://${serverIpAddress}:30552/download`, (res) => {
     const path = "./src/tests/test.spec.ts";

     fs.closeSync(fs.openSync(path, 'w'))
     const writeStream = fs.createWriteStream(path)
     res.pipe(writeStream);
     
     writeStream.on('finish', async () => {
         writeStream.close();
         console.log('Log: Test downloaded!');
         await runTest()
     })
    })

async function runTest(){
    try {
        console.log('Log: Run test...')
        const pwrun = execa.commandSync('npx playwright test')
        //console.log(pwrun.stdout)

        await returnResults();
    } catch (error) {
        console.log('Error:' + error)
    }
}

async function returnResults() {
    console.log('Log: Return results...')
    const formData = new FormData();
    formData.append('result', fs.createReadStream('./result/jres.json'));
    formData.append('name', 'test01');
    formData.append('script', 'src/TestFiles/test01.spec.ts');
    formData.append('state', 'Ready');
    try {
        const response = await axios.post(`http://${serverIpAddress}:30552/upload-result/3`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        console.log('Log: ' + response.status)
    }
    catch (error) {
        console.log('Error: ' + error)
    }
}