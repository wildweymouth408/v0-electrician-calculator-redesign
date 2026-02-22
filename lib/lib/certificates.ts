import { supabase } from './supabase'

export async function uploadCertificate(
  userId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}/${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from('Certificates')
    .upload(filePath, file, { upsert: false })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  return filePath
}

export async function getCertificateUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('Certificates')
    .createSignedUrl(filePath, 3600)

  if (error) {
    console.error('Signed URL error:', error)
    return null
  }

  return data.signedUrl
}

export async function deleteCertificate(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from('Certificates')
    .remove([filePath])

  if (error) {
    console.error('Delete error:', error)
    return false
  }

  return true
}
