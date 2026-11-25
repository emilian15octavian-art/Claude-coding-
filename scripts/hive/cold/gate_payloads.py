#!/usr/bin/env python3
"""Builds Metricool scheduling payloads ONLY for posts whose viral exam says PASS. Blocked posts are refused.
Usage: python3 gate_payloads.py plan.json id=publicUrl [id=publicUrl ...]  -> prints the batch JSON"""
import json, re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
plan = {p['id']: p for p in json.load(open(sys.argv[1]))}
batch = []
for arg in sys.argv[2:]:
    pid, url = arg.split('=', 1)
    rep = json.load(open(os.path.join(HERE, 'exam', f'{pid}.json')))
    if rep['status'] != 'PASS' or not rep['winner']:
        sys.exit(f'REFUSED: {pid} did not pass the viral exam')
    p, hook = plan[pid], re.sub(r'\*', '', rep['winner']['hook'])
    text = p['caption'].replace('\n\n#', '\n🎧 Our music: linktr.ee/bleedingdebts316\n\n#', 1)
    info = {"autoPublish": True, "draft": False, "descendants": [], "firstCommentText": "", "hasNotReadNotes": False,
            "shortener": False, "smartLinkData": {"ids": []}, "media": [url], "mediaAltText": [],
            "providers": [{"network": n} for n in ("instagram", "facebook", "tiktok", "youtube")],
            "publicationDate": {"dateTime": f"{p['date']}T{p['time']}:00", "timezone": "Europe/Bucharest"},
            "text": text, "instagramData": {"type": "REEL", "showReelOnFeed": True}, "facebookData": {"type": "REEL"},
            "tiktokData": {"privacyOption": "PUBLIC_TO_EVERYONE", "title": hook[:85]},
            "youtubeData": {"title": f"{hook} #shorts", "type": "short", "privacy": "public", "madeForKids": False,
                            "category": "MUSIC", "tags": ["metal", "christian metal", "romanian metal", "Bleeding Debts 316"]}}
    batch.append({"tool_slug": "METRICOOL_MCP_CREATE_SCHEDULED_POST",
                  "arguments": {"blogId": "8106502", "date": f"{p['date']}T{p['time']}:00+02:00", "info": json.dumps(info, ensure_ascii=False)}})
print(json.dumps(batch, ensure_ascii=False))
