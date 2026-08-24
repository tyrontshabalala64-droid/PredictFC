 // src/services/uploadService.js
import { supabase } from '../lib/supabase'

export async function uploadImage(file, userId, bucket = 'post-images') {
    if (!file) return null
    
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('File must be an image or video')
    }
    
    // Validate file size
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
        throw new Error(`File must be less than ${maxSize / (1024 * 1024)}MB`)
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const fileName = `${userId}/${timestamp}-${randomString}.${fileExt}`
    
    console.log('Uploading:', fileName)
    
    const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
        })
    
    if (error) {
        console.error('Upload error:', error)
        throw new Error('Failed to upload file: ' + error.message)
    }
    
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)
    
    return data.publicUrl
}

export async function deleteImage(filePath, bucket = 'post-images') {
    if (!filePath) return
    try {
        const url = new URL(filePath)
        const path = url.pathname.split('/').slice(3).join('/')
        await supabase.storage.from(bucket).remove([path])
    } catch (error) {
        console.error('Delete error:', error)
    }
}

export async function uploadAvatar(file, userId) {
    return uploadImage(file, userId, 'avatars')
}