#!/bin/bash

ipaddr="`ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}' | head -n 1`"

killAndResetContainers="0";
pullContainers="0";
action="start";

containerNameSqlServer="sqlserver";
containerNameAzureStorage="azurestorage";
containerNameCosmos="cosmosdb";

while getopts a:k:p: flag
do
    case "${flag}" in
        a) action=${OPTARG};;
        k) killAndResetContainers=${OPTARG};;
        p) pullContainers=${OPTARG};;
    esac
done

echo "  "
echo "FYI, the available script options are: "
echo "  a - container action                     --> start|stop|none"
echo "  k - kill and reset containers            --> 0|1"
echo "  p - pull containers for updated versions --> 0|1"
echo "  "

if [ "$killAndResetContainers" != "1" ]; then
    echo "***** NOT KILLING AND RESETTING CONTAINERS *****"
else
    echo "***** KILLING AND RESETTING CONTAINERS *****"
    
    docker stop $containerNameAzureStorage || true && docker rm $containerNameAzureStorage || true
    docker stop $containerNameSqlServer || true && docker rm $containerNameSqlServer || true
    docker stop $containerNameCosmos || true && docker rm $containerNameCosmos || true
fi

if [ "$pullContainers" != "1" ]; then
    echo "***** NOT PULLING CONTAINERS *****"
else
    echo "***** PULLING CONTAINERS *****"
    
    docker pull mcr.microsoft.com/azure-storage/azurite
    docker pull mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
    docker pull mcr.microsoft.com/mssql/server:2019-latest
fi

if [ "$action" == "start" ]; then
    echo "***** STARTING CONTAINERS *****"
    
    if [ "$(docker ps -q -f name=$containerNameAzureStorage -f status=exited)" ]; then
        echo "***** resuming $containerNameAzureStorage *****"
        docker start $containerNameAzureStorage
    elif [ "$(docker ps -q -f name=$containerNameAzureStorage -f status=running)" ]; then
        echo "***** container for $containerNameAzureStorage already running *****"
    else
        echo "***** starting new instance of $containerNameAzureStorage *****"
        docker run --name $containerNameAzureStorage -p 10000:10000 -p 10001:10001 -d mcr.microsoft.com/azure-storage/azurite
    fi

    if [ "$(docker ps -q -f name=$containerNameCosmos -f status=exited)" ]; then
        echo "***** resuming $containerNameCosmos *****"
        docker start $containerNameCosmos
    elif [ "$(docker ps -q -f name=$containerNameCosmos -f status=running)" ]; then
        echo "***** container for $containerNameCosmos already running *****"
    else
        echo "***** starting new instance of $containerNameCosmos *****"
        docker run -p 8081:8081 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254  -m 3g --cpus=2.0 --name $containerNameCosmos -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10 -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true -e AZURE_COSMOS_EMULATOR_IP_ADDRESS_OVERRIDE=$ipaddr -d mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
    fi

    if [ "$(docker ps -q -f name=$containerNameSqlServer -f status=exited)" ]; then
        echo "***** resuming $containerNameSqlServer *****"
        docker start $containerNameSqlServer
    elif [ "$(docker ps -q -f name=$containerNameSqlServer -f status=running)" ]; then
        echo "***** container for $containerNameSqlServer already running *****"
    else
        echo "***** starting new instance of $containerNameSqlServer *****"
        docker run --name $containerNameSqlServer -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=Pa$$word' -p 1433:1433 -e 'MSSQL_PID=Standard' -d mcr.microsoft.com/mssql/server:2019-latest
    fi
elif [ "$action" == "stop" ]; then
    echo "***** STOPPING CONTAINERS *****"
    
    docker stop $containerNameAzureStorage || true
    docker stop $containerNameSqlServer || true
    docker stop $containerNameCosmos || true
else
    echo "***** NOT RUNNING START OR STOP CONTAINER ACTIONS *****"
fi


