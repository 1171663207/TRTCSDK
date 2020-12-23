#pragma once
#include <string>
#include <map>
#include <windows.h>

namespace TrtcUtil
{
    std::string genRandomNumString(int length); //length > 0 && length <= 20
    std::wstring getAppDirectory();
    void getSizeAlign16(long originWidth, long originHeight, long& align16Width, long& align16Height);
    void convertCaptureResolution(int resolution, long& width, long& height);
    
    std::wstring convertMSToTime(long lCurMS,long lDurationMS);

    std::map<int,std::string> split(char* str, const char* pattern);

    bool SaveBitmapToFile(HBITMAP bitmap, const std::string& filename);  //����λͼ���ļ�
    WORD GetBitmapBitCount();  //����λͼ�ļ�ÿ��������ռ�ֽ���
    void ProcessPalette(HBITMAP hBitmap, const BITMAP& bitmap, DWORD paletteSize,
                               LPBITMAPINFOHEADER lpBmpInfoHeader);  //�����ɫ��
}
