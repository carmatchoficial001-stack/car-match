console.log('STARTING SIMPLE TEST')
import Replicate from 'replicate'
console.log('IMPORTED REPLICATE')
import dotenv from 'dotenv'
dotenv.config()
console.log('ENV LOADED', process.env.REPLICATE_API_TOKEN ? 'YES' : 'NO')
console.log('DONE')
