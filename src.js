import {BrowserMultiFormatReader} from '@zxing/browser';
import QRCodeWriter from '@zxing/library/esm/core/qrcode/QRCodeWriter.js';
import BarcodeFormat from '@zxing/library/esm/core/BarcodeFormat.js';
import EncodeHintType from '@zxing/library/esm/core/EncodeHintType.js';
import Code39Reader from '@zxing/library/esm/core/oned/Code39Reader.js';
const $=id=>document.getElementById(id);let controls=null;let last='';const reader=new BrowserMultiFormatReader();
let scanAttempts=0;let progressTimer=null;
function showResult(value,format){last=value;$('result').value=value;$('scanStatus').textContent='识别成功：'+format;navigator.vibrate?.(80)}
$('start').onclick=async()=>{
  try{
    controls?.stop();clearInterval(progressTimer);scanAttempts=0;
    $('scanStatus').textContent='正在打开相机…';
    controls=await reader.decodeFromConstraints({audio:false,video:{facingMode:'environment'}},$('video'),(result,error)=>{
      if(result){const value=result.getText();if(value!==last)showResult(value,result.getBarcodeFormat());}
      else if(error){scanAttempts++;}
    });
    $('empty').parentElement.classList.add('active');
    $('scanStatus').textContent='相机已开启，请将码放在画面中央';
    progressTimer=setInterval(()=>{
      if(!controls||$('result').value)return;
      const video=$('video');
      $('scanStatus').textContent=video.videoWidth?`正在识别 ${video.videoWidth}×${video.videoHeight} 画面（已尝试 ${scanAttempts} 次）。保持码清晰，或使用“拍照或选择图片”。`:'相机没有输出画面，请使用“拍照或选择图片”';
    },3500);
  }catch(e){$('scanStatus').textContent='无法开启相机：'+(e?.message||e?.name||'请检查相机权限');}
};
$('stop').onclick=()=>{controls?.stop();controls=null;clearInterval(progressTimer);$('video').srcObject=null;$('empty').parentElement.classList.remove('active');$('scanStatus').textContent='扫描已停止';};
$('photo').onchange=async event=>{
  const file=event.target.files?.[0];if(!file)return;
  controls?.stop();controls=null;clearInterval(progressTimer);$('empty').parentElement.classList.remove('active');
  const url=URL.createObjectURL(file);
  $('scanStatus').textContent='正在识别图片…';
  try{const result=await reader.decodeFromImageUrl(url);showResult(result.getText(),result.getBarcodeFormat());}
  catch(e){$('scanStatus').textContent='图片中未识别到条码或二维码。请对准、靠近并保持清晰后重试。';}
  finally{URL.revokeObjectURL(url);event.target.value='';}
};
$('copy').onclick=async()=>{if($('result').value){try{await navigator.clipboard.writeText($('result').value);$('scanStatus').textContent='已复制'}catch{$('scanStatus').textContent='复制失败，请长按结果手动复制'}}};
$('kind').onchange=()=>{$('formatHint').textContent=$('kind').value==='bar'?'Code 39 支持英文字母、数字、空格和 - . $ / + %；小写字母会转为大写。':'二维码支持中文、网址和普通文字。'};
function code39(value){const alphabet=Code39Reader.ALPHABET_STRING;const patterns=Code39Reader.CHARACTER_ENCODINGS;const chars='*'+value+'*';const units=[];for(const ch of chars){let pattern=ch==='*'?Code39Reader.ASTERISK_ENCODING:patterns[alphabet.indexOf(ch)];for(let i=0;i<9;i++)units.push({bar:i%2===0,width:(pattern&(1<<(8-i)))?3:1});units.push({bar:false,width:1})}return units}
function render(){const raw=$('content').value.trim(),kind=$('kind').value;if(!raw){$('genStatus').textContent='请先输入内容';return}if(Array.from(raw).length>100){$('genStatus').textContent='最多输入 100 个字符';return}let value=raw.toUpperCase();if(kind==='bar'&&!/^[0-9A-Z. $/+%-]+$/.test(value)){$('genStatus').textContent='Code 39 仅支持英文字母、数字、空格和 - . $ / + %';return}try{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(kind==='qr'){const hints=new Map([[EncodeHintType.CHARACTER_SET,'UTF-8']]);const matrix=new QRCodeWriter().encode(raw,BarcodeFormat.QR_CODE,480,480,hints);canvas.width=matrix.getWidth();canvas.height=matrix.getHeight();ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(matrix.get(x,y))ctx.fillRect(x,y,1,1)}else{const units=code39(value),sum=units.reduce((n,u)=>n+u.width,0),scale=3;canvas.width=(sum+20)*scale;canvas.height=210;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';let x=10*scale;for(const u of units){if(u.bar)ctx.fillRect(x,12,u.width*scale,175);x+=u.width*scale}}const preview=$('preview');preview.replaceChildren(canvas);const caption=document.createElement('strong');caption.textContent=kind==='bar'?value:raw;preview.append(caption);$('genStatus').textContent='已生成，可以保存 PDF 或打印';}catch(e){console.error(e);$('genStatus').textContent='生成失败：'+(e?.message||'请检查输入内容')}}
$('generate').onclick=render;$('print').onclick=()=>{if(!$('preview').querySelector('canvas'))render();if($('preview').querySelector('canvas'))(window.AndroidPrint?window.AndroidPrint.print():window.print())};
