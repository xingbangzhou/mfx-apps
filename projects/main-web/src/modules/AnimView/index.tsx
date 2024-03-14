import {memo, useCallback, useEffect, useRef} from 'react'
import './index.scss'
import Anim, {AnimHandler} from 'src/components/Anim'
import {Box, Grid} from '@mui/material'
import {mocks} from './mocks'
import DrapArea from './DrapArea'
import JSZip from 'jszip'

const DiView = memo(function DiView() {
  const handlerRef = useRef<AnimHandler>(null)

  useEffect(() => {
    handlerRef.current?.play(mocks)
  }, [])

  const onDrapped = useCallback((fileObj: File) => {
    const ziper = new JSZip()
    ziper.loadAsync(fileObj).then(
      data => {
        console.log(data)
      },
      err => {
        console.log(err)
      },
    )
    // const reader = new FileReader()
    // reader.onload = async ev => {
    //   if (ev.target) {
    //     const buffer = ev.target.result as ArrayBuffer
    //     const ziper = new JSZip()
    //     ziper.loadAsync(buffer).then(
    //       data => {
    //         console.log(data)
    //       },
    //       err => {
    //         console.log(err)
    //       },
    //     )
    //   }
    // }
    // reader.readAsArrayBuffer(fileObj)
  }, [])

  return (
    <Box className="animView">
      <Grid className="contentWrap" container spacing={2} justifyContent={'center'}>
        <DrapArea className="animWrap" onDrapped={onDrapped}>
          <Anim className="anim" handlerRef={handlerRef} />
        </DrapArea>
      </Grid>
    </Box>
  )
})

export default DiView
