import {BrowserMultiFormatReader} from '@zxing/browser';
import QRCodeWriter from '@zxing/library/esm/core/qrcode/QRCodeWriter.js';
import BarcodeFormat from '@zxing/library/esm/core/BarcodeFormat.js';
import EncodeHintType from '@zxing/library/esm/core/EncodeHintType.js';
import Code39Reader from '@zxing/library/esm/core/oned/Code39Reader.js';
import DecodeHintType from '@zxing/library/esm/core/DecodeHintType.js';
const $=id=>document.getElementById(id);let controls=null;let last='';const hints=new Map([[DecodeHintType.TRY_HARDER,true],[DecodeHintType.POSSIBLE_FORMATS,[BarcodeFormat.QR_CODE,BarcodeFormat.CODE_128,BarcodeFormat.EAN_13,BarcodeFormat.EAN_8,BarcodeFormat.CODE_39,BarcodeFormat.UPC_A]]]);const reader=new BrowserMultiFormatReader(hints);
let scanAttempts=0;let progressTimer=null;let scanError="";
function showResult(value,format){last=value;$('result').value=value;$('scanStatus').textContent='识别成功：'+format;navigator.vibrate?.(80)}
$('start').onclick=async()=>{
  try{
    controls?.stop();clearInterval(progressTimer);scanAttempts=0;scanError="";
    $('scanStatus').textContent='正在打开相机…';
    controls=await reader.decodeFromConstraints({audio:false,video:{facingMode:'environment'}},$('video'),(result,error)=>{
      if(result){const value=result.getText();if(value!==last)showResult(value,result.getBarcodeFormat());}
      else if(error){scanAttempts++;if(!/NotFound|Checksum|Format/.test(error.name||""))scanError=(error.name||"错误")+": "+(error.message||"");}
    });
    $('empty').parentElement.classList.add('active');
    $('scanStatus').textContent='相机已开启，请将码放在画面中央';
    progressTimer=setInterval(()=>{
      if(!controls||$('result').value)return;
      const video=$('video');
      $('scanStatus').textContent=video.videoWidth?`正在识别 ${video.videoWidth}×${video.videoHeight} 画面（已尝试 ${scanAttempts} 次）${scanError?"；"+scanError:""}。若仍未识别，可选择照片。`:'相机没有输出画面，请使用“拍照或选择图片”';
    },3500);
  }catch(e){$('scanStatus').textContent='无法开启相机：'+(e?.message||e?.name||'请检查相机权限');}
};
$('stop').onclick=()=>{controls?.stop();controls=null;clearInterval(progressTimer);$('video').srcObject=null;$('empty').parentElement.classList.remove('active');$('scanStatus').textContent='扫描已停止';};
async function decodePhoto(event){
  const file=event.target.files?.[0];if(!file)return;
  controls?.stop();controls=null;clearInterval(progressTimer);$('empty').parentElement.classList.remove('active');
  $('scanStatus').textContent='正在读取图片…';
  const url=URL.createObjectURL(file),image=new Image();
  try{
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('图片无法打开，请换用 JPG 或 PNG'));image.src=url;});
    const originalWidth=image.naturalWidth,originalHeight=image.naturalHeight;
    let failure;
    for(const maxSide of [1600,1000]){
      const scale=Math.min(1,maxSide/Math.max(originalWidth,originalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(originalWidth*scale));canvas.height=Math.max(1,Math.round(originalHeight*scale));
      const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,canvas.width,canvas.height);
      for(const crop of [0,0.15]){
        const target=document.createElement('canvas');target.width=Math.round(canvas.width*(1-2*crop));target.height=Math.round(canvas.height*(1-2*crop));
        target.getContext('2d',{willReadFrequently:true}).drawImage(canvas,canvas.width*crop,canvas.height*crop,target.width,target.height,0,0,target.width,target.height);
        try{const result=reader.decodeFromCanvas(target);showResult(result.getText(),result.getBarcodeFormat());return;}
        catch(error){failure=error;}
      }
    }
    $('scanStatus').textContent=`未识别到条码或二维码（图片 ${originalWidth}×${originalHeight}；${failure?.name||'未知错误'}）。请让码占据照片较大面积，并避免反光。`;
  }catch(error){$('scanStatus').textContent='图片读取失败：'+(error?.message||error?.name||'未知错误');}
  finally{URL.revokeObjectURL(url);event.target.value='';}
}
$('photo').onchange=decodePhoto;$('cameraPhoto').onchange=decodePhoto;
$('copy').onclick=async()=>{if($('result').value){try{await navigator.clipboard.writeText($('result').value);$('scanStatus').textContent='已复制'}catch{$('scanStatus').textContent='复制失败，请长按结果手动复制'}}};
$('kind').onchange=()=>{$('formatHint').textContent=$('kind').value==='bar'?'Code 39 支持英文字母、数字、空格和 - . $ / + %；小写字母会转为大写。':'二维码支持中文、网址和普通文字。'};
function code39(value){const alphabet=Code39Reader.ALPHABET_STRING;const patterns=Code39Reader.CHARACTER_ENCODINGS;const chars='*'+value+'*';const units=[];for(const ch of chars){let pattern=ch==='*'?Code39Reader.ASTERISK_ENCODING:patterns[alphabet.indexOf(ch)];for(let i=0;i<9;i++)units.push({bar:i%2===0,width:(pattern&(1<<(8-i)))?3:1});units.push({bar:false,width:1})}return units}
function render(){const raw=$('content').value.trim(),kind=$('kind').value;if(!raw){$('genStatus').textContent='请先输入内容';return}if(Array.from(raw).length>100){$('genStatus').textContent='最多输入 100 个字符';return}let value=raw.toUpperCase();if(kind==='bar'&&!/^[0-9A-Z. $/+%-]+$/.test(value)){$('genStatus').textContent='Code 39 仅支持英文字母、数字、空格和 - . $ / + %';return}try{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(kind==='qr'){const hints=new Map([[EncodeHintType.CHARACTER_SET,'UTF-8']]);const matrix=new QRCodeWriter().encode(raw,BarcodeFormat.QR_CODE,480,480,hints);canvas.width=matrix.getWidth();canvas.height=matrix.getHeight();ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(matrix.get(x,y))ctx.fillRect(x,y,1,1)}else{const units=code39(value),sum=units.reduce((n,u)=>n+u.width,0),scale=3;canvas.width=(sum+20)*scale;canvas.height=210;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';let x=10*scale;for(const u of units){if(u.bar)ctx.fillRect(x,12,u.width*scale,175);x+=u.width*scale}}const preview=$('preview');preview.replaceChildren(canvas);const caption=document.createElement('strong');caption.textContent=kind==='bar'?value:raw;preview.append(caption);$('genStatus').textContent='已生成，可以保存 PDF 或打印';}catch(e){console.error(e);$('genStatus').textContent='生成失败：'+(e?.message||'请检查输入内容')}}
$('generate').onclick=render;$('print').onclick=()=>{if(!$('preview').querySelector('canvas'))render();if($('preview').querySelector('canvas'))(window.AndroidPrint?window.AndroidPrint.print():window.print())};
