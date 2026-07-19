from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    bim_worker_token: str
    bim_allowed_source_hosts: str = "localhost,minio"
    bim_max_elements: int = 250_000
    bim_max_file_bytes: int = 1_073_741_824

    @property
    def allowed_hosts(self) -> set[str]:
        return {
            host.strip().lower()
            for host in self.bim_allowed_source_hosts.split(",")
            if host.strip()
        }


settings = Settings()
