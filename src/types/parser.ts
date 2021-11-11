export interface ManifestJSON {
  FormatVersion: number;
  EncryptionKey: boolean;
  Assets: {
    Name: string;
    AssetType: string;
    Length: number;
    CompressedLength: number;
    Priority: number;
    wrapper?: string;
    Hash: string;
    MD5: string;
    Dependencies: [];
    IndexedAssets: string[];
    AllowDecryption: boolean;
  }[];
}

export interface Data {
  url: string;
  file: string;
  id: string;
}

export interface ArenaVersion {
  VersionURL: string;
  Versions: Record<string, string>;
  CurrentPatchURL: string;
  Flavor: string;
  ProductCode: string;
  CurrentInstallerURL: string;
  Name: string;
  BinaryURL: string;
  FileCount: string;
}
