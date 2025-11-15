export type CreateFileUploadRequest = {
  name: string,
  path: string
  file: File ,
  archive_installation_id?: string,
}