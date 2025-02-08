# hikvision2mqtt

This is a `node API` that receive events from `Hikvision` face recognition terminal 
events and convert it to `mqtt events` to be used for automations with `home assistant`



https://github.com/user-attachments/assets/fa2a3d53-1fb4-48c7-81ef-63ed60a79e6e



> Tested with DS-K1T342MWX model
  ![DS-K1T342MWX model](https://github.com/dflourusso/hikvision2mqtt/blob/main/docs/DS-K1T342MWX.png?raw=true)

## How it works

It's pretty simple:

1. Some person recognizes your face in front of the face recognition terminal
2. The Hikvision terminal will POST the events to this API
3. This API will parse the events received and send it to the MQTT service
4. You can listen for the MQTT events on the specified topic and create the automations you want

## Installation

Currently the only installation supported is Docker. It also expect you already have home assistant, mqtt, etc... configured and running

### Env file

First of all, you will need a `.env` file with some required variables and configuration. Example:

```
MQTT_URL=mqtt://192.168.0.100:2883
MQTT_USERNAME=your-mqtt-username
MQTT_PASSWORD=your-mqtt-password
MQTT_PUBLISH_TOPIC=face_recognition
API_TOKEN=some-your-token
INCLUDE_ORIGINAL_DATA=false
ONLY_KNOWN_EVENTS=true
PORT=3000
```

- `MQTT_PUBLISH_TOPIC` is the topic this API will send the events on the MQTT service. You will use this topic on home assistant to create your automations
- `API_TOKEN` protects this API from unauthorized access/requests. You can generate any hash/random string you want. We will need to configure the hikivision events later and send this token on the event to authenticate the request
- `INCLUDE_ORIGINAL_DATA`: If this value is `true`, the API will send all the original data received from the Hikvision event to the MQTT service
- `ONLY_KNOWN_EVENTS`: The Hikvision events are based on numeric codes which makes the use of it a little hard. So this API convets some most used codes to named strings to make the usage easier. The KNOWN events are: `remoteUnlock`, `remoteLock`, `unlock`, `lock`, `doorOpenTimeout`, `authenticatedViaFace`


### Docker compose file

You can create a `docker-compose.yml` on your server and start it.

> [Docker image](https://hub.docker.com/repository/docker/dflourusso/hikvision2mqtt/general)

```yml
services:
  app:
    image: dflourusso/hikvision2mqtt:1.0.1
    ports:
      - "${PORT}:3000"
    environment:
      - MQTT_URL=${MQTT_URL}
      - MQTT_USERNAME=${MQTT_USERNAME}
      - MQTT_PASSWORD=${MQTT_PASSWORD}
      - MQTT_PUBLISH_TOPIC=${MQTT_PUBLISH_TOPIC}
      - API_TOKEN=${API_TOKEN}
      - INCLUDE_ORIGINAL_DATA=${INCLUDE_ORIGINAL_DATA}
      - ONLY_KNOWN_EVENTS=${ONLY_KNOWN_EVENTS}
    env_file:
      - .env
    restart: always
```

### Then start it:

```sh
docker compose up -d
```

## Configuration on the device dashboard

> It's supposed to you already configured the admin credentials, facial recognition, Wi-Fi/Cable connection, etc.. Your computer also needs to be connected on the same network as the Hikvision device

Open your browser and type the IP of the Hikvision device. Example: `192.168.0.5`

![DS-K1T342MWX model](https://github.com/dflourusso/hikvision2mqtt/blob/main/docs/sign-in.png?raw=true)

Navigate to `Network` -> `Advanced` -> `HTTP Listening`

![DS-K1T342MWX model](https://github.com/dflourusso/hikvision2mqtt/blob/main/docs/http-listener.png?raw=true)

Then set the `IP` and `port` you started this API service. Make sure to put `/hikvision/events` on the `URL` followd by the `token` that should match the `API_TOKEN` you created and added to the `.env` file on the installation step

## Creating automations on Home Assistant

You can create an automation that listen for MQTT events, then select your topic and add the wanted actions

![DS-K1T342MWX model](https://github.com/dflourusso/hikvision2mqtt/blob/main/docs/new-automation.png?raw=true)

Example of configuration:

```yml
alias: TestHikvisionFaceRecognition
description: ""
triggers:
  - trigger: mqtt
    topic: face_recognition
conditions: []
actions:
  - alias: Unlock
    if:
      - condition: template
        value_template: "{{ trigger.payload_json.eventName == 'unlock' }}"
    then:
      - action: lock.unlock
        metadata: {}
        data: {}
        target:
          entity_id: lock.name_of_your_lock
  - alias: Lock
    if:
      - condition: template
        value_template: "{{ trigger.payload_json.eventName == 'lock' }}"
    then:
      - action: lock.lock
        metadata: {}
        data: {}
        target:
          entity_id: lock.name_of_your_lock
mode: single

```
