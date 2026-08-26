const mongoose = require('mongoose')

const viewMongoDB = async () => {
    try {
        const uri = process.env.DATABASE_URI || 'mongodb://localhost:27017/bsd_project'
        await mongoose.connect(uri)
        console.log('\n✅ MongoDB connected!\n')

        const db = mongoose.connection.db
        const collections = await db.listCollections().toArray()
        console.log('📦 Collections in database:')
        collections.forEach(c => console.log(`  - ${c.name}`))

        for (const collection of collections) {
            const coll = db.collection(collection.name)
            const count = await coll.countDocuments()
            console.log(`\n📄 ${collection.name} (${count} documents):`)
            if (count > 0) {
                const docs = await coll.find().limit(2).toArray()
                console.log(JSON.stringify(docs, null, 2))
            }
        }

        await mongoose.connection.close()
        console.log('\n✅ Disconnected')
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

viewMongoDB()
