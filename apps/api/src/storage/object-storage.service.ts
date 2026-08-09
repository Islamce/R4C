import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class ObjectStorageService {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly presignClient: S3Client;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>("S3_BUCKET");
    const endpoint = config.get<string>("S3_ENDPOINT");
    const clientOptions = {
      region: config.get<string>("S3_REGION") ?? "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>("S3_ACCESS_KEY"),
        secretAccessKey: config.getOrThrow<string>("S3_SECRET_KEY"),
      },
    };
    this.client = new S3Client({ ...clientOptions, endpoint });
    this.presignClient = new S3Client({
      ...clientOptions,
      endpoint: config.get<string>("S3_PRESIGN_ENDPOINT") ?? endpoint,
    });
  }

  async createUploadUrl(storageKey: string, mimeType: string) {
    return getSignedUrl(
      this.presignClient,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ContentType: mimeType,
      }),
      { expiresIn: 900 },
    );
  }

  async createDownloadUrl(storageKey: string, fileName: string) {
    return getSignedUrl(
      this.presignClient,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ResponseContentDisposition: `attachment; filename="${fileName.replaceAll('"', "")}"`,
      }),
      { expiresIn: 300 },
    );
  }

  async head(storageKey: string) {
    const result = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
    return {
      sizeBytes: result.ContentLength,
      checksumSha256: result.ChecksumSHA256,
      etag: result.ETag?.replaceAll('"', ""),
    };
  }
}
