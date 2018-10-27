from key.line import channel_access_token, channel_channel_secret
from requests import get, post, delete
import json

# リッチメニューのボタンの配置を指定する


def button_data():
    data = {
        "size": {
            "width": 2500,
            "height": 1686
        },
        "selected": "false",
        "name": "Controller",
        "chatBarText": "コントローラ",
        "areas": [
            {
                "bounds": {
                    "x": 0,
                    "y": 0,
                    "width": 1250,
                    "height": 843
                },
                "action": {
                    "type": "message",
                    "text": "大喜利"
                }
            },
            {
                "bounds": {
                    "x": 1250,
                    "y": 0,
                    "width": 1250,
                    "height": 843
                },
                "action": {
                    "type": "message",
                    "text": "あるある"
                }
            },
            {
                "bounds": {
                    "x": 0,
                    "y": 843,
                    "width": 1250,
                    "height": 843
                },
                "action": {
                    "type": "message",
                    "text": "つっこみ"
                }
            },
            {
                "bounds": {
                    "x": 1250,
                    "y": 843,
                    "width": 2500,
                    "height": 1686
                },
                "action": {
                    "type": "message",
                    "text": "自分の投稿"
                }
            }
        ]
    }
    headers = {
        'Authorization': 'Bearer {}'.format(channel_access_token),
        'Content-Type': 'application/json',
    }
    response = post(
        'https://api.line.me/v2/bot/richmenu', headers=headers, data=json.dumps(data))
    return response.json()["richMenuId"]

# リッチメニューの画像をアップロードする


def upload_img(id, file):
    headers = {
        'Authorization': 'Bearer {}'.format(channel_access_token),
        'Content-Type': 'image/jpeg',
    }
    files = open(file, 'rb')
    response = post(
        'https://api.line.me/v2/bot/richmenu/{}/content'.format(id), headers=headers, data=files)
    print(response)
    print(response.json())

# デフォルトリッチメニューを登録


def set_richmenu(id):

    headers = {
        'Authorization': 'Bearer {}'.format(channel_access_token),
    }

    response = post(
        'https://api.line.me/v2/bot/user/all/richmenu/{}'.format(id), headers=headers)
    print(response, response.json())

# 現在のリッチメニューを登録


def get_richmenu():
    headers = {
        'Authorization': 'Bearer {}'.format(channel_access_token),
    }

    response = get(
        'https://api.line.me/v2/bot/user/all/richmenu', headers=headers)
    print(response, response.json())

# リッチメニューを削除


def del_richmenu(id):
    headers = {
        'Authorization': 'Bearer {}'.format(channel_access_token),
    }

    response = delete(
        'https://api.line.me/v2/bot/richmenu/{}'.format(id), headers=headers)
    print(response, response.json())

# デフォルトリッチメニューを解放


def releace_richmenu():
    headers = {
        'Authorization': 'Bearer {}'.format(channel_access_token),
    }

    response = delete(
        'https://api.line.me/v2/bot/user/all/richmenu', headers=headers)
    print(response, response.json())

# ユーザ紐づけリッチメニューを解放


def release_richmenu_user_id(userid):
    headers = {
        'Authorization': 'Bearer {}'.format(channel_access_token),
    }

    response = delete(
        'https://api.line.me/v2/bot/user/{}/richmenu'.format(userid), headers=headers)
    print(response, response.json())


if __name__ == '__main__':
    res = button_data()
    upload_img(res, "ann2 (2).png")
    set_richmenu(res)
