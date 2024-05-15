import { describe, expect, jest } from '@jest/globals';
import { getListCve, getcveById } from '../Controllers/CveController.js';


describe('geSearchedCve', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            query: {}
        };
        res = {
            render: jest.fn()
        };
    });

    it('Render cve datas agains the input parameter passed', async () => {
        //arrange
        req.query = {
            page: 1,
            limit: 10,
            year: "2022",
            lt: 10.0,
            gt: 0.0,
            id: "CVE-2022-1234"
        };
       
        const mockCount =1;
        const mockCountofpages = 1

      
       //act
        await getListCve(req, res);

      
         //assert
        expect(res.render).toHaveBeenCalledWith('index', expect.objectContaining({
            count: mockCount,
            year: req.query.year,
            id: req.query.id,
            page: req.query.page,
            lt: req.query.lt,
            gt: req.query.gt,
            limit: req.query.limit,
           countofpages : mockCountofpages,
           
            message: "success"
        }));
    });
    it('should return all the cve with the input id in param ' , async ()=>{
       
        req.params = {
            id:"CVE-2023-1232"
        }
        //arrange
        const mockcount = 1;
        const page = 1; 
        //act
        await getcveById(req, res);

       //assert
        expect(res.render).toHaveBeenCalledWith('cve' ,
        {
                cveById: (expect.objectContaining(
                {
                    id: req.params.id
                }
                                                )
                        )
        }
    )


    })
    
    
});
