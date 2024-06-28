import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket'
import useMC from './mc'
import usePXE from './pxe'
import useRPC from './rpc'

const loadConfig = async cfgFile => {
  const port = window.location.search.split('port=')[1];
  const Url = `http://localhost:${port}/start`;
  const raw = await fetch(Url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: cfgFile
    }),
  })
  const jsonData = await raw.json()
  return jsonData
}
export {
    useMC,
    usePXE,
    useRPC,
    loadConfig,
}
