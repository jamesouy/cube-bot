import { Awaitable } from 'discord.js'
import { getAllOfType } from '@utils'
import { readFile, writeFile, readdir } from 'fs/promises'
import { join } from 'path'


/**
 * Gets all initializers in the modules directory
 */
export function getAllInitializers() {
	return getAllOfType(Initializer, join(__dirname, '../modules'))
}


//////////////////////////////////////////////////////////
/// Initializer
/// Used to perform operations when the bot starts up
////////////////////////
export class Initializer {
	/**
	 * Run a function when the bot starts up.
	 * If an error occurs while running the function, the bot startup will be terminated
	 * @param run
	 * @returns
	 */
	constructor(readonly run: () => Awaitable<any>) {}
}


///////////////////////////////////////////////////
/// ConfigInitializer
/// Loads a config file when the bot starts up
///////////////////
const configInitializerKeys = ['run', 'save'] as (keyof ConfigInitializer)[]
export class ConfigInitializer extends Initializer {
	readonly save: () => Promise<void>
	/**
	 * Creates an object that is set from a config file when the bot starts up
	 * @param file The config file to read from
	 */
	private constructor(file: string, then: () => any) {
		super(async () => {
			const config = await readFile(`./config/${file}`)
				.then(content => JSON.parse(content.toString()))
			for (const key in config) {
				if (key in this) 
					throw new Error(`Cannot use the reserved property ${key} in ${file}`)
				//@ts-ignore
				this[key] = config[key] 
			}
			then()
		})
		this.save = () => {
			const obj: any = {}
			for (const key in this)
				if (!(configInitializerKeys as string[]).includes(key))
					obj[key] = this[key]
			return writeFile(`./config/${file}`, JSON.stringify(obj, null, 4))
		}
	}
	static create = <T>(file: string, then: () => any = () => {}) => 
		new ConfigInitializer(file, then) as T & ConfigInitializer
}