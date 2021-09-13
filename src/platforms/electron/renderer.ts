import { startApp } from '../../core'
import { database } from './db-sqlite3'
import { openExternal } from './openExternal'

startApp(database, openExternal)
