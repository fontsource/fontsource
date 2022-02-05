import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { packageLink } from './cdnLinks';

export const latestFontVersion = async (
  httpService: HttpService,
  id: string,
): Promise<string> => {
  const res: AxiosResponse = await lastValueFrom(
    httpService.get(packageLink(id)),
  );

  return res.data.version;
};
