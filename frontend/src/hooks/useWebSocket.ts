import { useEffect, useCallback, useRef } from 'react'
import { wsService } from '../services/websocket'
import { useAppStore } from '../stores/appStore'
import { useDataStore } from '../stores/dataStore'
import type { WSMessage, ComputationTask } from '../types'

export function useWebSocket() {
  const setWsConnected = useAppStore((s) => s.setWsConnected)
  const addTask = useDataStore((s) => s.addTask)
  const updateTask = useDataStore((s) => s.updateTask)
  const unsubRef = useRef<(() => void)[]>([])

  useEffect(() => {
    wsService.connect((connected) => {
      setWsConnected(connected)
    })

    const unsub1 = wsService.subscribe('task_update', (msg: WSMessage) => {
      const task = msg.payload as ComputationTask
      updateTask(task.taskId, task)
    })

    const unsub2 = wsService.subscribe('task_complete', (msg: WSMessage) => {
      const task = msg.payload as ComputationTask
      updateTask(task.taskId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        result: task.result,
      })
    })

    const unsub3 = wsService.subscribe('task_error', (msg: WSMessage) => {
      const task = msg.payload as ComputationTask
      updateTask(task.taskId, {
        status: 'failed',
        message: task.message || 'Unknown error',
      })
    })

    unsubRef.current = [unsub1, unsub2, unsub3]

    return () => {
      unsubRef.current.forEach((fn) => fn())
    }
  }, [setWsConnected, updateTask])

  const submitTask = useCallback((params: {
    taskType: 'batch_apsp' | 'moa_simulation' | 'pathway_analysis'
    cancerTypes: string[]
  }) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const task: ComputationTask = {
      taskId,
      type: params.taskType,
      status: 'queued',
      progress: 0,
      message: 'Task queued...',
      startedAt: new Date().toISOString(),
    }
    addTask(task)
    wsService.send({ type: 'compute_submit', taskId, ...params })
    return taskId
  }, [addTask])

  return {
    connected: useAppStore((s) => s.wsConnected),
    submitTask,
    tasks: useDataStore((s) => s.tasks),
  }
}
