import { startApp } from '../../core'
import { database } from './db-localstorage'
import { openExternal } from './openExternal'

startApp(database, openExternal)
