import execa from 'execa';

try {
    console.log('Log: Start server...');
    //const stdout = execa('dotnet /BUILD/EK7TKN_HFT_2021221.Endpoint.dll --urls=http://0.0.0.0:5000', {detached: true}).stdout?.pipe(process.stdout);
    //const stdout = execa('dotnet --info', {detached: true}).stdout?.pipe(process.stdout);
    const stdout = execa('dotnet', ['/BUILD/EK7TKN_HFT_2021221.Endpoint.dll', '--urls=http://0.0.0.0:5000'], {detached: true}).stdout?.pipe(process.stdout);

} catch (error) {
    console.log('Error:' + error)
}
