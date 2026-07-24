import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import RecordDetailMvpPage from './RecordDetailMvpPage'

vi.mock('@/api',()=>({fetchRecord:vi.fn().mockResolvedValue({id:'r1',code:'EXP-1',projectName:'项目',title:'记录',creatorName:'B',updatedAt:'2026-07-23',status:'IN_PROGRESS',experimentType:'PCR',experimentDate:'2026-07-23',purpose:'目的',templateSnapshot:{name:'空白',fields:[]},fieldValues:{},contentHtml:'<p>安全正文</p><script>x()</script>',capabilities:{canEdit:false,canDelete:false}}),fetchRevisions:vi.fn().mockResolvedValue([]),fetchAttachments:vi.fn().mockResolvedValue([]),deleteRecord:vi.fn(),approveReview:vi.fn(),requestReviewChanges:vi.fn(),downloadMarkdown:vi.fn(),downloadPdf:vi.fn(),fetchExportPreview:vi.fn(),saveBlob:vi.fn()}))
describe('RecordDetailMvpPage',()=>{it('hides edit and delete for read-only participants',async()=>{render(<MemoryRouter initialEntries={['/records/r1']}><Routes><Route path="/records/:recordId" element={<RecordDetailMvpPage/>}/></Routes></MemoryRouter>);expect(await screen.findByText('记录')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'编辑'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'删除'})).not.toBeInTheDocument();expect(screen.queryByText('x()')).not.toBeInTheDocument()})})
