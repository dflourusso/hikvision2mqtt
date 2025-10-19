const eventMap = {
  '3.1024': 'remoteUnlock',
  '3.1025': 'remoteLock',
  '5.21': 'unlock',
  '5.22': 'lock',
  '5.28': 'doorOpenTimeout',
  '5.75': 'authenticatedViaFace',
}

function eventParser(data) {
  event = data.AccessControllerEvent
  const eventType = `${event.majorEventType}.${event.subEventType}`
  const eventName = eventMap[eventType] || 'unknown'

  const parsedData = {
    eventType,
    eventName,
    deviceName: event.deviceName,
  }

  if (eventName === 'authenticatedViaFace') {
    parsedData.userName = event.name
    parsedData.userNoString = event.employeeNoString
  }

  if (process.env.INCLUDE_ORIGINAL_DATA === 'true') {
    parsedData.originalData = data
  }

  return parsedData
}

module.exports = { EventParser: eventParser }