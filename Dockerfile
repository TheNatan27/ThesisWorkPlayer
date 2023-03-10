############ BUILD

FROM mcr.microsoft.com/dotnet/sdk:5.0 as builder

RUN dotnet --version
COPY /EK7TKN_HFT_2021221/ /SOURCE
RUN dotnet publish -o /BUILD ./SOURCE/EK7TKN_HFT_2021221.sln

############ INSTALL DOTNET

FROM mcr.microsoft.com/windows:ltsc2019 as dotnetinstaller

WORKDIR C:/DEPENDENCIES/
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]
RUN (New-Object System.Net.WebClient).DownloadFile('https://download.visualstudio.microsoft.com/download/pr/d20a2521-d273-4ce3-b740-f9b2c363d110/e569a7b31d816d2f04baa81bf06a59ba/dotnet-sdk-5.0.408-win-x86.exe', 'c:\DEPENDENCIES\dotnet-sdk-5.0.408-win-x86.exe') ; \
    Start-Sleep -s 30 ; \
    Start-Process 'dotnet-sdk-5.0.408-win-x86.exe' -ArgumentList '/q /norestart /log /logdot.loq' ; \
    Start-Sleep -s 30

RUN dotnet --version

COPY --from=builder /BUILD /APP

############ INSTALL NODE

FROM dotnetinstaller as nodeinstaller

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';$ProgressPreference='silentlyContinue';"]

RUN Invoke-WebRequest -OutFile nodejs.zip -UseBasicParsing "https://nodejs.org/dist/v18.14.2/node-v18.14.2-win-x64.zip"; \
    Start-Sleep -s 30 ; \
    Expand-Archive nodejs.zip -DestinationPath C:\ ; \
    Start-Sleep -s 30 ; \
    Rename-Item "C:\\node-v18.14.2-win-x64" c:\nodejs

RUN SETX PATH C:\nodejs
RUN npm config set registry https://registry.npmjs.org/

############ COPY PLAYER

COPY /WorkPlayer /WORKPLAYER
WORKDIR /WORKPLAYER

RUN ls
RUN npm install

############ APPLICATION

FROM nodeinstaller as application

WORKDIR /

EXPOSE 80
ENTRYPOINT  npm test --prefix ./WORKPLAYER/

#dotnet ./APP/EK7TKN_HFT_2021221.Endpoint.dll --urls=http://0.0.0.0:80 &&




#COPY /Dependencies/SQL2019-SSEI-Expr.exe c:/DEPENDENCIES/ 
#WORKDIR c:/DEPENDENCIES/
#SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

#RUN (New-Object System.Net.WebClient).DownloadFile('https://download.microsoft.com/download/7/f/8/7f8a9c43-8c8a-4f7c-9f92-83c18d96b681/SQL2019-SSEI-Expr.exe', 'c:\DEPENDENCIES\SQL2019-SSEI-Expr.exe')
#RUN dir
#RUN ./SQL2019-SSEI-Expr.exe /ACTION=Download /MEDIATYPE=LocalDB /QUIET
#RUN powershell.exe -Command Start-Process ./SQL2019-SSEI-Expr.exe -ArgumentList /ACTION=Download MEDIAPATH=C:\en-us /MEDIATYPE=LocalDB /QUIET

#RUN (New-Object System.Net.WebClient).DownloadFile('https://download.microsoft.com/download/7/f/8/7f8a9c43-8c8a-4f7c-9f92-83c18d96b681/SQL2019-SSEI-Expr.exe', 'c:\DEPENDENCIES\SQL2019-SSEI-Expr.exe') ; \
#    ./SQL2019-SSEI-Expr.exe /ACTION=Download /MEDIATYPE=LocalDB /QUIET MEDIAPATH=C:\ ;\
 #   Start-Sleep -s 30

#WORKDIR C:/en-us
#RUN dir
#RUN Start-Process 'msiexec' -ArgumentList '/i ./SqlLocalDB.msi IACCEPTSQLLOCALDBLICENSETERMS=YES /quiet /qn /norestart /log ./log.log' ;\
 #   Start-Sleep -s 30








#WORKDIR C:/en-us
#RUN dir
#RUN Start-Process 'msiexec' -ArgumentList '/i ./SqlLocalDB.msi IACCEPTSQLLOCALDBLICENSETERMS=YES /quiet /qn /norestart /log ./log.log' ;\
#    Start-Sleep -s 30


 #FROM mcr.microsoft.com/dotnet/framework/sdk:latest
#FROM mcr.microsoft.com/dotnet/sdk:5.0.403-windowsservercore-ltsc2019
#FROM mcr.microsoft.com/dotnet/framework/runtime:4.7.2-windowsservercore-ltsc2019
#FROM mcr.microsoft.com/dotnet/sdk:5.0.0-windowsservercore-ltsc2019
#FROM mcr.microsoft.com/dotnet/framework/aspnet:windowsservercore as runner
